"""
arena/feed_store.py
Thread-safe in-memory feed store with JSON persistence.

Post schema:
  id, twin_slug, twin_name, content, timestamp, reply_to_id,
  topic, source_chunks
"""

import json
import logging
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

log = logging.getLogger("arena.feed_store")


class FeedStore:
    def __init__(self, persist_path: Optional[Path] = None):
        self._posts: list[dict]     = []
        self._index: dict[str, int] = {}   # post_id → list index
        self._lock  = threading.Lock()
        self._path  = persist_path

        if persist_path and persist_path.exists():
            self._load()

    # ── Persistence ───────────────────────────────────────────────────────────

    def _load(self):
        try:
            data = json.loads(self._path.read_text(encoding="utf-8"))
            self._posts = data if isinstance(data, list) else []
            self._index = {p["id"]: i for i, p in enumerate(self._posts)}
            log.info("FeedStore loaded %d posts from %s", len(self._posts), self._path)
        except Exception as exc:
            log.warning("FeedStore load failed: %s", exc)
            self._posts = []
            self._index = {}

    def _save(self):
        if not self._path:
            return
        try:
            self._path.parent.mkdir(parents=True, exist_ok=True)
            self._path.write_text(
                json.dumps(self._posts, indent=2, ensure_ascii=False),
                encoding="utf-8",
            )
        except Exception as exc:
            log.warning("FeedStore save failed: %s", exc)

    # ── Write ─────────────────────────────────────────────────────────────────

    def add_post(
        self,
        twin_slug:    str,
        twin_name:    str,
        content:      str,
        topic:        str = "",
        reply_to_id:  Optional[str] = None,
        source_chunks: Optional[list[dict]] = None,
    ) -> dict:
        post = {
            "id":           str(uuid.uuid4()),
            "twin_slug":    twin_slug,
            "twin_name":    twin_name,
            "content":      content,
            "timestamp":    datetime.now(timezone.utc).isoformat(),
            "reply_to_id":  reply_to_id,
            "topic":        topic,
            "source_chunks": [
                {
                    "source_type": c.get("source_type", ""),
                    "source_id":   c.get("source_id",   ""),
                    "publish_date":c.get("publish_date", ""),
                    "rrf_score":   c.get("rrf_score",   0),
                    "snippet":     c.get("text",        "")[:120],
                }
                for c in (source_chunks or [])
            ],
        }
        with self._lock:
            self._index[post["id"]] = len(self._posts)
            self._posts.append(post)
            self._save()
        log.info("[%s] Post added: %s", twin_slug, content[:60])
        return post

    # ── Read ──────────────────────────────────────────────────────────────────

    def get_feed(self, limit: int = 20) -> list[dict]:
        with self._lock:
            return list(reversed(self._posts[-limit:]))

    def get_post(self, post_id: str) -> Optional[dict]:
        with self._lock:
            idx = self._index.get(post_id)
            if idx is not None:
                return self._posts[idx]
            return None

    def get_replies(self, post_id: str) -> list[dict]:
        with self._lock:
            return [p for p in self._posts if p.get("reply_to_id") == post_id]

    def get_latest_by_slug(self, slug: str, limit: int = 5) -> list[dict]:
        with self._lock:
            return [p for p in reversed(self._posts) if p["twin_slug"] == slug][:limit]

    def count(self) -> int:
        return len(self._posts)
