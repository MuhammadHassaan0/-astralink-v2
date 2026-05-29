"""
arena/api.py
FastAPI router for AstraLink Arena.

Endpoints:
  GET  /arena/feed        — latest 20 posts
  POST /arena/inject      — inject a topic, returns all generated posts
  GET  /arena/twins       — all twin profiles + relationship graph
  POST /arena/react       — trigger a reaction to a specific post
  GET  /arena/healthz     — arena-specific liveness check
"""

import json
import logging
import os
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

log = logging.getLogger("arena.api")

router = APIRouter(prefix="/arena", tags=["arena"])

# ── Lazy singletons ───────────────────────────────────────────────────────────
_engine    = None
_store     = None
_twins     = None
_graph     = None

def _get_engine():
    global _engine, _store, _twins, _graph
    if _engine is not None:
        return _engine

    from groq import Groq
    from qdrant_client import QdrantClient

    from arena.feed_store import FeedStore
    from arena.retriever  import retrieve
    from arena.twin       import load_twin
    from arena.engine     import ArenaEngine

    GROQ_API_KEY   = os.getenv("GROQ_API_KEY", "")
    QDRANT_URL     = os.getenv("QDRANT_URL",     "http://localhost:6333")
    QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", None)

    groq_client = Groq(api_key=GROQ_API_KEY)

    # Resolve paths relative to the mamdani service root
    service_root = Path(__file__).parent.parent   # mamdani/
    repo_root    = service_root.parent             # repo root (local dev)

    # System prompts: check mamdani/arena/prompts/ first, then repo-root prompts/
    prompts_dir = service_root / "arena" / "prompts"
    if not prompts_dir.exists():
        alt = repo_root / "prompts"
        prompts_dir = alt if alt.exists() else None

    # Profile data: repo-root data/{slug}/profile.json
    profiles_dir = repo_root / "data"
    if not profiles_dir.exists():
        profiles_dir = None

    # Relationship graph
    graph: dict = {}
    for candidate in [
        repo_root / "data" / "relationship_graph.json",
        service_root / "arena" / "relationship_graph.json",
    ]:
        if candidate.exists():
            try:
                graph = json.loads(candidate.read_text())
                log.info("Relationship graph loaded from %s", candidate)
                break
            except Exception:
                pass

    _graph = graph

    # Feed store — persist at repo-root data/ if writable, else in-memory
    feed_path = repo_root / "data" / "arena_feed.json"
    try:
        feed_path.parent.mkdir(parents=True, exist_ok=True)
        _store = FeedStore(persist_path=feed_path)
    except Exception:
        _store = FeedStore(persist_path=None)

    # Partial retrieval function bound to credentials
    def _retrieve(query: str, slug: str, top_k: int = 5) -> list[dict]:
        return retrieve(
            query=query,
            slug=slug,
            qdrant_url=QDRANT_URL,
            qdrant_api_key=QDRANT_API_KEY,
            top_k=top_k,
        )

    SLUG_LIST = ["mrbeast", "ishowspeed", "kaicenat", "ksi", "loganpaul", "jakepaul", "garyvee", "kaitrump"]
    _twins = {}
    for slug in SLUG_LIST:
        try:
            twin = load_twin(
                slug=slug,
                groq_client=groq_client,
                retrieve_fn=_retrieve,
                prompts_dir=prompts_dir,
                profiles_dir=profiles_dir,
                graph=graph,
            )
            _twins[slug] = twin
            log.info("[%s] Twin loaded", slug)
        except Exception as exc:
            log.error("[%s] Twin load failed: %s", slug, exc)

    _engine = ArenaEngine(
        twins=_twins,
        feed_store=_store,
        groq_client=groq_client,
    )
    log.info("ArenaEngine initialised with %d twins", len(_twins))
    return _engine


# ── Request / response schemas ────────────────────────────────────────────────

class InjectRequest(BaseModel):
    topic: str

class ReactRequest(BaseModel):
    post_id: str


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/feed")
def arena_feed(limit: int = 20):
    try:
        engine = _get_engine()
        posts  = engine.get_feed(limit=limit)
        return {"posts": posts, "count": len(posts)}
    except Exception as exc:
        log.error("/arena/feed error: %s", exc)
        raise HTTPException(status_code=503, detail=str(exc))


@router.post("/inject")
def arena_inject(req: InjectRequest):
    topic = req.topic.strip()
    if not topic:
        raise HTTPException(status_code=400, detail="topic cannot be empty")
    if len(topic) > 500:
        raise HTTPException(status_code=400, detail="topic too long (max 500 chars)")

    try:
        engine = _get_engine()
        posts  = engine.inject_topic(topic)
        return {
            "topic":      topic,
            "posts":      posts,
            "post_count": len(posts),
        }
    except Exception as exc:
        log.error("/arena/inject error: %s", exc)
        raise HTTPException(status_code=503, detail=str(exc))


@router.get("/twins")
def arena_twins():
    try:
        _get_engine()
        twins_out = {}
        for slug, twin in (_twins or {}).items():
            twins_out[slug] = {
                "slug":         twin.slug,
                "name":         twin.name,
                "core_traits":  twin.profile.get("core_traits", []),
                "top_topics":   twin.profile.get("top_topics", []),
                "relationships": twin.relationships,
            }
        return {
            "twins":             twins_out,
            "relationship_graph": _graph or {},
        }
    except Exception as exc:
        log.error("/arena/twins error: %s", exc)
        raise HTTPException(status_code=503, detail=str(exc))


@router.post("/react")
def arena_react(req: ReactRequest):
    post_id = req.post_id.strip()
    if not post_id:
        raise HTTPException(status_code=400, detail="post_id cannot be empty")

    try:
        engine = _get_engine()
        reply  = engine.generate_reaction(post_id)
        if reply is None:
            raise HTTPException(
                status_code=404,
                detail="Post not found or no suitable reactor available",
            )
        return {"reply": reply}
    except HTTPException:
        raise
    except Exception as exc:
        log.error("/arena/react error: %s", exc)
        raise HTTPException(status_code=503, detail=str(exc))


@router.get("/healthz")
def arena_healthz():
    try:
        engine     = _get_engine()
        twin_count = len(_twins or {})
        post_count = (_store.count() if _store else 0)
        return {
            "status":     "ok",
            "twins_loaded": twin_count,
            "feed_posts":   post_count,
        }
    except Exception as exc:
        return {"status": "error", "detail": str(exc)}
