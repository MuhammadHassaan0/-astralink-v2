"""
api/chat.py
FastAPI app — streaming SSE chat endpoint for the Kai Trump digital twin.

Endpoints:
  POST /kai/chat   — hybrid RAG + Groq LLM, streamed SSE
  GET  /healthz    — lightweight liveness check (always 200)
"""

import json
import logging
import os
import sys
from datetime import date
from pathlib import Path

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
log = logging.getLogger("kai.api")

# ── dotenv ────────────────────────────────────────────────────────────────────
try:
    from dotenv import load_dotenv
    ROOT     = Path(__file__).parent.parent
    ENV_FILE = ROOT / ".env"
    load_dotenv(ENV_FILE)
    log.info("dotenv loaded from %s", ENV_FILE)
except Exception as _e:
    log.warning("dotenv load failed (ok in prod): %s", _e)
    ROOT = Path(__file__).parent.parent

# ── FastAPI ───────────────────────────────────────────────────────────────────
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

# ── Config ────────────────────────────────────────────────────────────────────
GROQ_API_KEY    = os.getenv("GROQ_API_KEY", "")
QDRANT_URL      = os.getenv("QDRANT_URL", "http://localhost:6333")
QDRANT_API_KEY  = os.getenv("QDRANT_API_KEY", None)
COLLECTION_NAME = "kai"
LLM_MODEL       = "llama-3.3-70b-versatile"
MAX_CTX_TOKENS  = 1500
TOP_K           = 8

log.info("GROQ_API_KEY present: %s", bool(GROQ_API_KEY))
log.info("QDRANT_URL: %s", QDRANT_URL)
log.info("QDRANT_API_KEY present: %s", bool(QDRANT_API_KEY))

# ── Paths ─────────────────────────────────────────────────────────────────────
PERSONA_FILE = ROOT / "prompts" / "kai_persona.md"
FRONTEND_DIR = ROOT / "frontend"

log.info("ROOT: %s", ROOT)
log.info("PERSONA_FILE exists: %s", PERSONA_FILE.exists())
log.info("FRONTEND_DIR exists: %s", FRONTEND_DIR.exists())

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
            _persona_text = "You are Kai Trump."
    return _persona_text


def get_retriever():
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
app = FastAPI(title="Kai Trump Digital Twin", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

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


# ── Schemas ───────────────────────────────────────────────────────────────────
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


def build_system_prompt(context: str) -> str:
    today        = date.today().isoformat()
    persona_text = get_persona_text()
    return f"""{persona_text}

---

## Today's Date
{today}

---

## Retrieved Context
The following passages are from documented sources about you. Ground your answer in this material where relevant.

{context}

---

## Instructions
Answer as Kai Trump. 2–4 sentences. Casual, warm, genuine. No bullet points. No PR language. Use the context if relevant; otherwise draw on your documented personality and interests."""


def sse_event(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"


# ── Chat endpoint ─────────────────────────────────────────────────────────────

@app.post("/kai/chat")
async def kai_chat(req: ChatRequest):
    if not req.messages:
        raise HTTPException(status_code=400, detail="messages cannot be empty")

    user_messages = [m for m in req.messages if m.role == "user"]
    if not user_messages:
        raise HTTPException(status_code=400, detail="no user message found")

    query = user_messages[-1].content.strip()

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
    system_prompt = build_system_prompt(context)

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

        try:
            groq = get_groq()
            stream = groq.chat.completions.create(
                model=LLM_MODEL,
                messages=groq_messages,
                stream=True,
                max_tokens=256,
                temperature=0.7,
            )
            for chunk in stream:
                token = chunk.choices[0].delta.content or ""
                if token:
                    yield sse_event({"type": "token", "content": token})
        except Exception as e:
            log.error("Groq stream error: %s", e)
            yield sse_event({"type": "error", "message": str(e)})

        yield sse_event({"type": "done"})

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ── Health check ──────────────────────────────────────────────────────────────

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
        "status":     "ok",
        "service":    "kai",
        "qdrant":     qdrant_status,
        "chunks":     chunk_count,
        "collection": COLLECTION_NAME,
        "model":      LLM_MODEL,
        "today":      date.today().isoformat(),
    }


# ── Dev entrypoint ────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.chat:app", host="0.0.0.0", port=8000, reload=True)
