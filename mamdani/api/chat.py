"""
api/chat.py
FastAPI app — streaming SSE chat endpoint for the Mamdani digital twin.

Endpoints:
  POST /mamdani/chat   — hybrid RAG + Groq LLM, streamed SSE
  GET  /healthz        — Qdrant + chunk count health check
"""

import json
import os
import sys
from datetime import date
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from groq import Groq
from pydantic import BaseModel
from qdrant_client import QdrantClient

# ── Paths ─────────────────────────────────────────────────────────────────────
ROOT          = Path(__file__).parent.parent
PERSONA_FILE  = ROOT / "prompts" / "mamdani_persona.md"
CHUNKS_FILE   = ROOT / "ingestion" / "raw_data" / "chunks.json"
FRONTEND_DIR  = ROOT / "frontend"
ENV_FILE      = ROOT / ".env"

load_dotenv(ENV_FILE)

# ── Add parent to sys.path so retrieval/ is importable ───────────────────────
sys.path.insert(0, str(ROOT))
from retrieval.retriever import retrieve, classify_query   # noqa: E402

# ── Config ────────────────────────────────────────────────────────────────────
GROQ_API_KEY    = os.getenv("GROQ_API_KEY", "")
QDRANT_URL      = os.getenv("QDRANT_URL", "http://localhost:6333")
QDRANT_API_KEY  = os.getenv("QDRANT_API_KEY", None)
COLLECTION_NAME = "mamdani"
LLM_MODEL       = "llama-3.3-70b-versatile"
MAX_CTX_TOKENS  = 1500
TOP_K           = 8

if not GROQ_API_KEY:
    raise RuntimeError("GROQ_API_KEY not set in environment or .env")

groq_client  = Groq(api_key=GROQ_API_KEY)
qdrant       = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
PERSONA_TEXT = PERSONA_FILE.read_text()

# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(title="Mamdani Digital Twin", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Serve frontend ────────────────────────────────────────────────────────────
app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")

@app.get("/")
def serve_frontend():
    return FileResponse(str(FRONTEND_DIR / "index.html"))


# ── Request / response schemas ─────────────────────────────────────────────────
class Message(BaseModel):
    role:    str   # "user" | "assistant"
    content: str

class ChatRequest(BaseModel):
    messages:   list[Message]
    session_id: str | None = None
    debug:      bool = False


# ── Context builder ───────────────────────────────────────────────────────────

def estimate_tokens(text: str) -> int:
    return int(len(text.split()) * 0.75)


def build_context_block(chunks: list[dict], max_tokens: int = MAX_CTX_TOKENS) -> str:
    """
    Assemble retrieved chunks into a context block, respecting token budget.
    Sorted by rrf_score (already ranked), with priority_score as tiebreaker.
    """
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


# ── Prompt assembly ───────────────────────────────────────────────────────────

def build_system_prompt(context: str) -> str:
    today = date.today().isoformat()
    return f"""{PERSONA_TEXT}

---

## Today's Date
{today}

---

## Retrieved Context
The following passages are from your actual documented record — speeches, policy documents, official sources. Ground your answer in this material where relevant.

{context}

---

## Instructions
Answer as Zohran Mamdani. 2–4 sentences. Direct, concrete, grounded. No bullet points. No press-release language. If the context above is directly relevant, use it. If it is not relevant to the question, draw on your documented positions."""


# ── SSE event helpers ─────────────────────────────────────────────────────────

def sse_event(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"


# ── Chat endpoint ─────────────────────────────────────────────────────────────

@app.post("/mamdani/chat")
async def mamdani_chat(req: ChatRequest):
    if not req.messages:
        raise HTTPException(status_code=400, detail="messages cannot be empty")

    # Last user message is the query
    user_messages = [m for m in req.messages if m.role == "user"]
    if not user_messages:
        raise HTTPException(status_code=400, detail="no user message found")

    query = user_messages[-1].content.strip()
    query_type = classify_query(query)

    # ── Retrieve context
    chunks = retrieve(query, top_k=TOP_K)
    context = build_context_block(chunks, max_tokens=MAX_CTX_TOKENS)

    # ── Build prompts
    system_prompt = build_system_prompt(context)

    # History: all messages except the last user message (already in query)
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

    # ── Debug info
    debug_info = None
    if req.debug:
        debug_info = {
            "query_type":   query_type,
            "chunks_used":  len(chunks),
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

    # ── Stream response
    async def event_stream():
        if debug_info:
            yield sse_event({"type": "debug", "data": debug_info})

        stream = groq_client.chat.completions.create(
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

        yield sse_event({"type": "done"})

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control":      "no-cache",
            "X-Accel-Buffering":  "no",
        },
    )


# ── Health check ──────────────────────────────────────────────────────────────

@app.get("/healthz")
def healthz():
    # Qdrant
    try:
        info   = qdrant.get_collection(COLLECTION_NAME)
        qdrant_status = str(info.status).lower()
        chunk_count   = qdrant.count(COLLECTION_NAME).count
    except Exception as e:
        qdrant_status = f"red ({e})"
        chunk_count   = 0

    return {
        "status":  "ok",
        "qdrant":  qdrant_status,
        "chunks":  chunk_count,
        "model":   LLM_MODEL,
        "today":   date.today().isoformat(),
    }


# ── Dev entrypoint ────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.chat:app", host="0.0.0.0", port=8000, reload=True)
