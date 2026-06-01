"""
arena/api.py
FastAPI router for AstraLink Arena.

Endpoints:
  GET  /arena/feed          — latest posts (session-feed on frontend, all on backend)
  POST /arena/inject        — inject a topic, returns all generated posts
  GET  /arena/twins         — all twin profiles + relationship graph
  POST /arena/react         — trigger a twin-to-twin reaction on a post
  POST /arena/crowd-react   — 🔥/💀 crowd reaction; triggers responses if thresholds met
  GET  /arena/activity      — recent activity log (clap-backs, crowd responses)
  POST /arena/tts           — text-to-speech via Mistral Voxtral
  GET  /arena/healthz       — liveness check
"""

import asyncio
import base64
import json
import logging
import os
import time
from collections import deque
from pathlib import Path
from typing import Optional

import requests as http_requests
from fastapi import APIRouter, BackgroundTasks, HTTPException
from fastapi.responses import Response
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

    service_root = Path(__file__).parent.parent
    repo_root    = service_root.parent

    prompts_dir = service_root / "arena" / "prompts"
    if not prompts_dir.exists():
        alt = repo_root / "prompts"
        prompts_dir = alt if alt.exists() else None

    profiles_dir = repo_root / "data"
    if not profiles_dir.exists():
        profiles_dir = None

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

    feed_path = repo_root / "data" / "arena_feed.json"
    try:
        feed_path.parent.mkdir(parents=True, exist_ok=True)
        _store = FeedStore(persist_path=feed_path)
    except Exception:
        _store = FeedStore(persist_path=None)

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


# ── Voice IDs for Mistral Voxtral TTS ────────────────────────────────────────
VOICE_IDS: dict[str, str] = {
    "garyvee":  "3db14ade-2a4b-4891-8ab9-0cc160754817",
    "kaicenat": "c2ec493d-d04c-4070-aabb-ead66f9129b7",
}

# ── Twin name lookup (for activity messages) ──────────────────────────────────
_TWIN_NAMES = {
    "mrbeast":    "MrBeast",
    "ishowspeed": "IShowSpeed",
    "kaicenat":   "Kai Cenat",
    "ksi":        "KSI",
    "loganpaul":  "Logan Paul",
    "jakepaul":   "Jake Paul",
    "garyvee":    "Gary Vaynerchuk",
    "kaitrump":   "Kai Trump",
}

# ── In-memory reaction state ──────────────────────────────────────────────────
# topic → post_id → {slug, text, fire, nah, crowd_done}
reaction_store: dict = {}
# topic → slug → {fire, nah}
twin_sentiment: dict = {}
# (topic, loser_slug) → last clap-back timestamp
clap_back_cooldown: dict = {}
# topic → last auto-continue timestamp
auto_continue_last: dict = {}
# ring-buffer of recent activity events
_activity_log: deque = deque(maxlen=20)

FIRE_CROWD_THRESHOLD  = 3     # fires on one post → crowd response from that twin
FIRE_CLAP_THRESHOLD   = 5     # fire gap between twins → losing twin claps back
CLAP_COOLDOWN_SECS    = 60    # min seconds between clap-backs per (topic, twin)
AUTO_CONTINUE_SECS    = 45    # min seconds between auto-continues per topic
AUTO_CONTINUE_MIN_RXN = 5     # min total reactions to trigger auto-continue


def _log_activity(msg: str) -> None:
    _activity_log.appendleft({"message": msg, "ts": int(time.time())})
    log.info("[activity] %s", msg)


# ── Request / response schemas ────────────────────────────────────────────────

class InjectRequest(BaseModel):
    topic: str

class ReactRequest(BaseModel):
    post_id: str

class TTSRequest(BaseModel):
    slug: str
    text: str

class CrowdReactRequest(BaseModel):
    post_id:   str
    slug:      str
    reaction:  str    # 'fire' | 'nah'
    topic:     str
    post_text: str


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/feed")
def arena_feed(limit: int = 100):
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
        # Build sentiment context for this topic if reactions exist
        sentiment = twin_sentiment.get(topic, {})
        posts  = engine.inject_topic(topic, sentiment_context=_build_sentiment_str(topic))
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


@router.post("/crowd-react")
async def arena_crowd_react(req: CrowdReactRequest, background_tasks: BackgroundTasks):
    """
    Record a 🔥/💀 crowd reaction. Updates in-memory reaction counts and
    schedules background threshold checks (crowd response, clap-back, auto-continue).
    Returns updated fire + nah totals for the post immediately.
    """
    if req.reaction not in ("fire", "nah"):
        raise HTTPException(status_code=400, detail="reaction must be 'fire' or 'nah'")

    topic = (req.topic or "general").strip()[:200]

    # Update reaction_store
    if topic not in reaction_store:
        reaction_store[topic] = {}
    if req.post_id not in reaction_store[topic]:
        reaction_store[topic][req.post_id] = {
            "slug": req.slug, "text": req.post_text[:500],
            "fire": 0, "nah": 0, "crowd_done": False,
        }
    post_data = reaction_store[topic][req.post_id]
    post_data[req.reaction] = post_data.get(req.reaction, 0) + 1

    # Update twin_sentiment
    if topic not in twin_sentiment:
        twin_sentiment[topic] = {}
    if req.slug not in twin_sentiment[topic]:
        twin_sentiment[topic][req.slug] = {"fire": 0, "nah": 0}
    twin_sentiment[topic][req.slug][req.reaction] += 1

    # Schedule threshold checks in background (non-blocking)
    background_tasks.add_task(_maybe_trigger, topic, req.post_id, dict(post_data))

    return {"ok": True, "fire": post_data["fire"], "nah": post_data["nah"]}


@router.get("/activity")
def arena_activity():
    """Recent crowd activity — clap-backs, crowd responses, auto-continues."""
    return {"activity": list(_activity_log)}


@router.get("/sentiment/{topic_key}")
def arena_sentiment(topic_key: str):
    """Current fire/nah totals per twin on a topic."""
    return {
        "sentiment": twin_sentiment.get(topic_key, {}),
        "posts":     reaction_store.get(topic_key, {}),
    }


@router.post("/tts")
def arena_tts(req: TTSRequest):
    """Convert a creator's post text to speech via Mistral Voxtral. Returns audio/wav."""
    voice_id = VOICE_IDS.get(req.slug)
    if not voice_id:
        raise HTTPException(status_code=404, detail=f"No voice registered for '{req.slug}'")

    mistral_key = os.getenv("MISTRAL_API_KEY", "")
    if not mistral_key:
        raise HTTPException(status_code=503, detail="TTS not configured — MISTRAL_API_KEY missing")

    text = req.text.strip()[:500]
    if not text:
        raise HTTPException(status_code=400, detail="text cannot be empty")

    try:
        resp = http_requests.post(
            "https://api.mistral.ai/v1/audio/speech",
            headers={"Authorization": f"Bearer {mistral_key}"},
            json={"model": "voxtral-mini-tts-2603", "voice": voice_id, "input": text},
            timeout=30,
        )
    except Exception as exc:
        log.error("/arena/tts upstream request failed: %s", exc)
        raise HTTPException(status_code=502, detail="TTS upstream request failed")

    if not resp.ok:
        log.error("/arena/tts upstream error %d: %s", resp.status_code, resp.text[:200])
        raise HTTPException(status_code=502, detail=f"TTS upstream error {resp.status_code}")

    try:
        data        = resp.json()
        audio_bytes = base64.b64decode(data["audio_data"])
    except Exception as exc:
        log.error("/arena/tts response parse failed: %s", exc)
        raise HTTPException(status_code=502, detail="TTS response parse failed")

    log.info("[%s] TTS generated %d bytes", req.slug, len(audio_bytes))
    return Response(content=audio_bytes, media_type="audio/wav")


@router.get("/healthz")
def arena_healthz():
    try:
        engine     = _get_engine()
        twin_count = len(_twins or {})
        post_count = (_store.count() if _store else 0)
        total_rxn  = sum(
            p["fire"] + p["nah"]
            for topic_posts in reaction_store.values()
            for p in topic_posts.values()
        )
        return {
            "status":       "ok",
            "twins_loaded": twin_count,
            "feed_posts":   post_count,
            "total_reactions": total_rxn,
        }
    except Exception as exc:
        return {"status": "error", "detail": str(exc)}


# ── Background reaction logic ─────────────────────────────────────────────────

def _build_sentiment_str(topic: str) -> str:
    """Build a one-line sentiment summary for the LLM system prompt."""
    sentiment = twin_sentiment.get(topic, {})
    if not sentiment:
        return ""
    parts = [
        f"{_TWIN_NAMES.get(slug, slug)} ({d['fire']} fire / {d['nah']} nah)"
        for slug, d in sentiment.items()
        if d["fire"] + d["nah"] > 0
    ]
    if not parts:
        return ""
    return "Current crowd sentiment: " + ", ".join(parts)


async def _maybe_trigger(topic: str, post_id: str, post_data: dict) -> None:
    """
    Background task: check all thresholds and generate responses if met.
    Runs async; Groq calls are offloaded to thread executor via asyncio.to_thread.
    """
    engine = _get_engine()
    if not engine:
        return

    slug       = post_data["slug"]
    twin_name  = _TWIN_NAMES.get(slug, slug)
    fire_count = post_data["fire"]

    # ── 1. Crowd response: 3+ fires on one post ───────────────────────────────
    if fire_count >= FIRE_CROWD_THRESHOLD and not post_data.get("crowd_done"):
        # Mark before generating so concurrent triggers don't double-fire
        if topic in reaction_store and post_id in reaction_store[topic]:
            reaction_store[topic][post_id]["crowd_done"] = True
        try:
            post = await asyncio.to_thread(
                engine.generate_crowd_response,
                slug=slug,
                post_text=post_data["text"],
                fire_count=fire_count,
                topic=topic,
            )
            if post:
                _log_activity(f"{twin_name} acknowledged the crowd energy")
        except Exception as exc:
            log.error("crowd_response failed: %s", exc)

    # ── 2. Clap-back: fire gap >= 5 between any two twins ────────────────────
    sentiment = twin_sentiment.get(topic, {})
    if len(sentiment) >= 2:
        ranked = sorted(sentiment.items(), key=lambda x: x[1]["fire"], reverse=True)
        winner_slug, winner_data = ranked[0]
        loser_slug,  loser_data  = ranked[1]
        gap = winner_data["fire"] - loser_data["fire"]
        if gap >= FIRE_CLAP_THRESHOLD:
            ck  = (topic, loser_slug)
            now = time.time()
            if now - clap_back_cooldown.get(ck, 0) >= CLAP_COOLDOWN_SECS:
                clap_back_cooldown[ck] = now
                # Find winning twin's highest-fire post text
                winner_posts = [
                    pd for pd in reaction_store.get(topic, {}).values()
                    if pd["slug"] == winner_slug
                ]
                winner_text = (
                    max(winner_posts, key=lambda p: p["fire"])["text"]
                    if winner_posts else ""
                )
                loser_name  = _TWIN_NAMES.get(loser_slug,  loser_slug)
                winner_name = _TWIN_NAMES.get(winner_slug, winner_slug)
                try:
                    post = await asyncio.to_thread(
                        engine.generate_clap_back,
                        loser_slug=loser_slug,
                        winner_slug=winner_slug,
                        topic=topic,
                        winner_post_text=winner_text,
                    )
                    if post:
                        _log_activity(f"{loser_name} clapped back at {winner_name}")
                except Exception as exc:
                    log.error("clap_back failed: %s", exc)

    # ── 3. Auto-continue: 45s interval + 5+ total reactions ──────────────────
    total_rxn = sum(
        p["fire"] + p["nah"]
        for p in reaction_store.get(topic, {}).values()
    )
    if total_rxn >= AUTO_CONTINUE_MIN_RXN:
        now = time.time()
        if now - auto_continue_last.get(topic, 0) >= AUTO_CONTINUE_SECS:
            auto_continue_last[topic] = now
            # Most-reacted twin (by fire + nah combined = controversy)
            top_entry = max(
                twin_sentiment.get(topic, {}).items(),
                key=lambda x: x[1]["fire"] + x[1]["nah"],
                default=(None, None),
            )
            top_slug = top_entry[0] if top_entry else None
            if top_slug:
                top_name = _TWIN_NAMES.get(top_slug, top_slug)
                try:
                    post = await asyncio.to_thread(
                        engine.generate_auto_continue,
                        slug=top_slug,
                        topic=topic,
                        sentiment=twin_sentiment.get(topic, {}),
                    )
                    if post:
                        _log_activity(f"{top_name} kept the debate alive on '{topic[:40]}'")
                except Exception as exc:
                    log.error("auto_continue failed: %s", exc)
