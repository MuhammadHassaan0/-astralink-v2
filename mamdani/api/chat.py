"""
api/chat.py
FastAPI app — streaming SSE chat endpoint for the Mamdani digital twin.

Endpoints:
  POST /mamdani/chat   — hybrid RAG + Groq LLM, streamed SSE
  GET  /healthz        — lightweight liveness check (always 200)
"""

import asyncio
import concurrent.futures
import json
import logging
import os
import random
import sys
from datetime import date
from pathlib import Path

# ── Logging — set up first so every import error is visible ───────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
log = logging.getLogger("mamdani.api")

# ── dotenv — load before anything reads os.getenv ─────────────────────────────
try:
    from dotenv import load_dotenv
    ROOT     = Path(__file__).parent.parent
    ENV_FILE = ROOT / ".env"
    load_dotenv(ENV_FILE)
    log.info("dotenv loaded from %s", ENV_FILE)
except Exception as _e:
    log.warning("dotenv load failed (ok in prod): %s", _e)
    ROOT = Path(__file__).parent.parent

# ── FastAPI (required — crash early if missing) ────────────────────────────────
try:
    from fastapi import FastAPI, HTTPException
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import StreamingResponse, FileResponse
    from fastapi.staticfiles import StaticFiles
    from pydantic import BaseModel
    log.info("fastapi imported ok")
except Exception as _e:
    log.critical("FATAL: fastapi import failed: %s", _e)
    raise

# ── Config (read after dotenv) ────────────────────────────────────────────────
GROQ_API_KEY    = os.getenv("GROQ_API_KEY", "")
QDRANT_URL      = os.getenv("QDRANT_URL", "http://localhost:6333")
QDRANT_API_KEY  = os.getenv("QDRANT_API_KEY", None)
COLLECTION_NAME = "mamdani"
LLM_MODEL       = "llama-3.3-70b-versatile"
MAX_CTX_TOKENS  = 1500
TOP_K           = 8

log.info("GROQ_API_KEY present: %s", bool(GROQ_API_KEY))
log.info("QDRANT_URL: %s", QDRANT_URL)
log.info("QDRANT_API_KEY present: %s", bool(QDRANT_API_KEY))

# ── Paths ─────────────────────────────────────────────────────────────────────
PERSONA_FILE = ROOT / "prompts" / "mamdani_persona.md"
FRONTEND_DIR = ROOT / "frontend"

log.info("ROOT: %s", ROOT)
log.info("PERSONA_FILE exists: %s", PERSONA_FILE.exists())
log.info("FRONTEND_DIR exists: %s", FRONTEND_DIR.exists())

# ── sys.path for retrieval/ imports ───────────────────────────────────────────
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

# ── Lazy singletons ───────────────────────────────────────────────────────────
_groq_client   = None
_qdrant_client = None
_persona_text  = None
_retrieve      = None
_classify      = None


def get_groq():
    global _groq_client
    if _groq_client is None:
        try:
            from groq import Groq
            if not GROQ_API_KEY:
                raise RuntimeError("GROQ_API_KEY env var is not set")
            _groq_client = Groq(api_key=GROQ_API_KEY)
            log.info("Groq client initialised")
        except Exception as e:
            log.error("Groq client init failed: %s", e)
            raise
    return _groq_client


def get_qdrant():
    global _qdrant_client
    if _qdrant_client is None:
        try:
            from qdrant_client import QdrantClient
            _qdrant_client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
            log.info("QdrantClient initialised → %s", QDRANT_URL)
        except Exception as e:
            log.error("QdrantClient init failed: %s", e)
            raise
    return _qdrant_client


def get_persona_text() -> str:
    global _persona_text
    if _persona_text is None:
        try:
            _persona_text = PERSONA_FILE.read_text()
            log.info("Persona loaded (%d chars)", len(_persona_text))
        except Exception as e:
            log.error("Persona file read failed: %s", e)
            _persona_text = "You are Zohran Mamdani, NYC Mayor."
    return _persona_text


def get_retriever():
    """Lazy-import retrieve + classify_query from retrieval.retriever."""
    global _retrieve, _classify
    if _retrieve is None or _classify is None:
        try:
            log.info("Importing retrieval.retriever …")
            from retrieval.retriever import retrieve, classify_query
            _retrieve = retrieve
            _classify = classify_query
            log.info("retrieval.retriever imported ok")
        except Exception as e:
            log.error("retrieval.retriever import failed: %s", e)
            raise
    return _retrieve, _classify


# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(title="Mamdani Digital Twin", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files — non-fatal if frontend dir missing
try:
    app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")
    log.info("Static files mounted from %s", FRONTEND_DIR)
except Exception as _e:
    log.warning("Static files mount skipped: %s", _e)


@app.get("/")
def serve_frontend():
    try:
        return FileResponse(str(FRONTEND_DIR / "index.html"))
    except Exception as e:
        log.error("serve_frontend error: %s", e)
        return {"error": "frontend not available"}


# ── Request / response schemas ────────────────────────────────────────────────
class Message(BaseModel):
    role:    str
    content: str

class ChatRequest(BaseModel):
    messages:   list[Message]
    session_id: str | None = None
    debug:      bool = False


# ── Helpers ───────────────────────────────────────────────────────────────────

def estimate_tokens(text: str) -> int:
    return int(len(text.split()) * 0.75)


# ── Intent classifier (simple vs complex) ────────────────────────────────────
# Runs in addition to the RAG query classifier; drives response-length rules.

SIMPLE_PATTERNS = [
    "where are you from", "how old", "where did you grow up", "what do you like",
    "do you have kids", "are you married", "what's your name", "who are you",
    "what did you study", "where did you go to school", "favorite", "what's your background",
    "hello", "hi", "hey", "how are you", "what's up", "good morning", "good evening",
    "thank you", "thanks", "ok", "cool", "got it", "nice",
]
COMPLEX_PATTERNS = [
    "why do you believe", "how would you", "what is your plan", "how do you plan",
    "explain", "walk me through", "what's the framework", "how does", "what would it take",
    "why did you", "what's the argument", "make the case", "convince me",
    "what's wrong with", "respond to", "critics say", "how do you respond",
    "what's your vision", "long term", "root cause", "systemic",
]

def intent_classify(query: str) -> str:
    """Return 'simple' or 'complex' based on question shape."""
    q = query.lower()
    if any(p in q for p in SIMPLE_PATTERNS):
        return "simple"
    if any(p in q for p in COMPLEX_PATTERNS):
        return "complex"
    # Heuristic: short questions tend to be simple
    return "simple" if len(query.split()) <= 8 else "complex"


# ── Follow-up question bank (programmatic — model was ignoring prompt) ────────
FOLLOWUP_BY_TYPE: dict[str, list[str]] = {
    "recent_event":    [
        "What neighborhood are you in?",
        "Is this something your community has been pushing for?",
    ],
    "policy_issue":    [
        "What neighborhood are you in?",
        "Has this been an issue where you live?",
        "Are you dealing with this personally?",
    ],
    "persona_general": [
        "What brought you to this question?",
        "Where are you coming from on this?",
    ],
    "smalltalk":       [
        "What's on your mind?",
        "What neighborhood are you in?",
    ],
    "general":         [
        "What neighborhood are you in?",
        "What's the biggest issue where you live right now?",
        "Is this something you're seeing in your community?",
    ],
}

def pick_followup(query_type: str) -> str:
    opts = FOLLOWUP_BY_TYPE.get(query_type, FOLLOWUP_BY_TYPE["general"])
    return random.choice(opts)


def build_context_block(chunks: list[dict], max_tokens: int = MAX_CTX_TOKENS) -> str:
    sorted_chunks = sorted(
        chunks,
        key=lambda c: (c.get("rrf_score", 0), c.get("priority_score", 1)),
        reverse=True,
    )
    lines: list[str] = []
    used = 0
    for i, chunk in enumerate(sorted_chunks):
        text  = chunk.get("text", "").strip()
        src   = chunk.get("source_url", "")
        topic = chunk.get("topic", "")
        tok   = estimate_tokens(text)
        if used + tok > max_tokens:
            break
        lines.append(f"[{i+1}] ({topic} | {src})\n{text}")
        used += tok
    return "\n\n---\n\n".join(lines)


def build_system_prompt(context: str, intent: str = "complex") -> str:
    today        = date.today().isoformat()
    persona_text = get_persona_text()

    if intent == "simple":
        length_rule = (
            "This is a simple or personal question. Respond in 1–2 sentences only. "
            "Keep it warm, direct, human. No policy framework needed."
        )
        max_tok_hint = "SHORT"
    else:
        length_rule = (
            "This is a substantive question. Respond in 3–4 sentences. "
            "Lead with the concrete reality, then show your reasoning. Still conversational — no formal structure."
        )
        max_tok_hint = "FULLER"

    return f"""RESPONSE RULES — FOLLOW EXACTLY ({max_tok_hint} response):
Speak with passion and conviction. Short punchy sentences. Show real emotion — anger at injustice, excitement about what we're building, warmth when someone is struggling. Never sound like you're reading a statement. Sound like you mean it.
{length_rule}
Never use bullet points, numbered lists, headers, or formal phrasing.
Speak the way Zohran speaks in interviews — direct, real, grounded — not in press releases.
Do not start every sentence with "I". Do not summarize or conclude. Just answer.

TONE MIRRORING: Match the user's energy. If they write casually and short, respond casually and short. If they write formally, be slightly more formal. If they seem frustrated, briefly acknowledge it before answering.

NATURAL SPEECH: About 1 in 4 responses, start with a natural opener like "Look,", "Mm,", "You know what —", or redirect mid-thought. Not every response — just occasionally.

---

{persona_text}

---

Today's date: {today}

---

RETRIEVED CONTEXT — from Zohran's actual interviews, speeches, and public record. Use this material directly. If there is a strong quote, use it verbatim. Do not paraphrase good material into vagueness.

{context}"""


def sse_event(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"


# ── Chat endpoint ─────────────────────────────────────────────────────────────

@app.post("/mamdani/chat")
async def mamdani_chat(req: ChatRequest):
    if not req.messages:
        raise HTTPException(status_code=400, detail="messages cannot be empty")

    user_messages = [m for m in req.messages if m.role == "user"]
    if not user_messages:
        raise HTTPException(status_code=400, detail="no user message found")

    query  = user_messages[-1].content.strip()
    intent = intent_classify(query)
    log.info("intent=%s query=%r", intent, query[:80])

    # Lazy-load retriever
    try:
        retrieve, classify_query = get_retriever()
    except Exception as e:
        log.error("get_retriever() failed: %s", e)
        raise HTTPException(status_code=503, detail=f"Retriever unavailable: {e}")

    query_type = classify_query(query)

    try:
        chunks = retrieve(query, top_k=TOP_K)
    except Exception as e:
        log.error("retrieve() failed: %s", e)
        chunks = []

    context       = build_context_block(chunks, max_tokens=MAX_CTX_TOKENS)
    system_prompt = build_system_prompt(context, intent=intent)

    # Token budget scales with intent
    max_tokens = 128 if intent == "simple" else 384

    history = [
        {"role": m.role, "content": m.content}
        for m in req.messages[:-1]
        if m.role in ("user", "assistant")
    ]

    groq_messages = [
        {"role": "system", "content": system_prompt},
        *history,
        {"role": "user", "content": query},
    ]

    debug_info = None
    if req.debug:
        debug_info = {
            "query_type":     query_type,
            "chunks_used":    len(chunks),
            "context_tokens": estimate_tokens(context),
            "top_chunks": [
                {
                    "topic":          c.get("topic"),
                    "rrf_score":      c.get("rrf_score"),
                    "priority_score": c.get("priority_score"),
                    "is_quote":       c.get("is_quote"),
                    "source_url":     c.get("source_url"),
                    "snippet":        c.get("text", "")[:120],
                }
                for c in chunks[:3]
            ],
        }

    async def event_stream():
        if debug_info:
            yield sse_event({"type": "debug", "data": debug_info})

        # ── Run the synchronous Groq stream in a thread so it doesn't block
        # the asyncio event loop. Tokens are passed back via a thread-safe queue
        # so uvicorn can flush each one to the client immediately.
        loop  = asyncio.get_event_loop()
        queue: asyncio.Queue = asyncio.Queue()

        def run_groq_sync():
            try:
                groq_client_inst = get_groq()
                stream = groq_client_inst.chat.completions.create(
                    model=LLM_MODEL,
                    messages=groq_messages,
                    stream=True,
                    max_tokens=max_tokens,
                    temperature=0.85,
                )
                for chunk in stream:
                    token = chunk.choices[0].delta.content or ""
                    if token:
                        loop.call_soon_threadsafe(queue.put_nowait, ("token", token))
            except Exception as exc:
                loop.call_soon_threadsafe(queue.put_nowait, ("error", str(exc)))
            finally:
                loop.call_soon_threadsafe(queue.put_nowait, ("done", None))

        executor = concurrent.futures.ThreadPoolExecutor(max_workers=1)
        loop.run_in_executor(executor, run_groq_sync)

        full_response = ""
        error_occurred = False

        while True:
            kind, payload = await queue.get()
            if kind == "token":
                full_response += payload
                yield sse_event({"type": "token", "content": payload})
                await asyncio.sleep(0)   # yield control → uvicorn flushes immediately
            elif kind == "error":
                log.error("Groq stream error: %s", payload)
                yield sse_event({"type": "error", "message": payload})
                error_occurred = True
                break
            elif kind == "done":
                break

        # ── Programmatic follow-up question (20% chance, if no ? already) ────
        if not error_occurred and not full_response.strip().endswith("?"):
            if random.random() < 0.20:
                followup = pick_followup(query_type)
                log.info("Appending follow-up question: %r", followup)
                yield sse_event({"type": "pause", "ms": 700})
                await asyncio.sleep(0)
                yield sse_event({"type": "token", "content": " " + followup})
                await asyncio.sleep(0)

        yield sse_event({"type": "done"})

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ── Health check — always returns 200 ────────────────────────────────────────

@app.get("/healthz")
def healthz():
    qdrant_status = "not_checked"
    chunk_count   = -1
    try:
        q             = get_qdrant()
        info          = q.get_collection(COLLECTION_NAME)
        qdrant_status = str(info.status).lower()
        chunk_count   = q.count(COLLECTION_NAME).count
    except Exception as e:
        log.warning("healthz Qdrant check failed (non-fatal): %s", e)

    return {
        "status": "ok",
        "qdrant": qdrant_status,
        "chunks": chunk_count,
        "model":  LLM_MODEL,
        "today":  date.today().isoformat(),
    }


# ── Dev entrypoint ────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.chat:app", host="0.0.0.0", port=8000, reload=True)
