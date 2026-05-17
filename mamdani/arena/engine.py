"""
arena/engine.py
The conversation engine — manages the feed and orchestrates twin interactions.

Methods:
  inject_topic(topic)       → all 6 twins post about the topic
  generate_reaction(post_id) → most likely twin replies based on relationship graph
  get_feed(limit)           → latest posts
  run_autonomous_loop()     → background loop: RSS topics + auto-reactions every 5 min
"""

import asyncio
import logging
import os
import random
import time
from pathlib import Path
from typing import Optional

import httpx

log = logging.getLogger("arena.engine")

GROQ_MODEL = "llama-3.3-70b-versatile"
SLUG_LIST  = ["mrbeast", "ishowspeed", "kaicenat", "ksi", "loganpaul", "jakepaul"]

# RSS feeds for autonomous topic injection
RSS_FEEDS = [
    "https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml",
    "https://www.reddit.com/r/videos.rss",
    "https://www.reddit.com/r/LivestreamFail.rss",
    "https://www.reddit.com/r/youtube.rss",
]

# Which twins are most likely to react to each other (from documented relationships)
REACTION_WEIGHTS: dict[str, dict[str, float]] = {
    "mrbeast":    {"kaicenat": 0.7, "ishowspeed": 0.5, "ksi": 0.4, "loganpaul": 0.3, "jakepaul": 0.2},
    "ishowspeed": {"kaicenat": 0.9, "ksi": 0.5, "mrbeast": 0.5, "loganpaul": 0.3, "jakepaul": 0.3},
    "kaicenat":   {"ishowspeed": 0.9, "mrbeast": 0.7, "ksi": 0.4, "loganpaul": 0.3, "jakepaul": 0.2},
    "ksi":        {"loganpaul": 0.8, "jakepaul": 0.7, "mrbeast": 0.4, "ishowspeed": 0.4, "kaicenat": 0.3},
    "loganpaul":  {"ksi": 0.8, "jakepaul": 0.7, "mrbeast": 0.4, "kaicenat": 0.3, "ishowspeed": 0.2},
    "jakepaul":   {"ksi": 0.7, "loganpaul": 0.6, "mrbeast": 0.5, "kaicenat": 0.3, "ishowspeed": 0.3},
}


def _weighted_pick(weights: dict[str, float]) -> str:
    """Pick a key weighted by float probability."""
    slugs = list(weights.keys())
    probs = [weights[s] for s in slugs]
    total = sum(probs)
    r     = random.random() * total
    cumul = 0.0
    for slug, p in zip(slugs, probs):
        cumul += p
        if r <= cumul:
            return slug
    return slugs[-1]


def _fetch_rss_topics(max_items: int = 5) -> list[str]:
    """Fetch recent headlines from RSS feeds as candidate topics."""
    import xml.etree.ElementTree as ET

    topics: list[str] = []
    feed = random.choice(RSS_FEEDS)
    try:
        resp = httpx.get(feed, timeout=8, follow_redirects=True,
                         headers={"User-Agent": "AstraLinkArena/1.0"})
        root  = ET.fromstring(resp.text)
        items = root.findall(".//item")
        for item in items[:max_items]:
            title = item.findtext("title") or ""
            title = title.strip()
            if title and len(title) > 10:
                topics.append(title)
    except Exception as exc:
        log.warning("RSS fetch failed (%s): %s", feed, exc)

    return topics or ["who is the biggest creator in the world right now"]


class ArenaEngine:
    def __init__(
        self,
        twins: dict,         # slug → Twin
        feed_store,          # FeedStore instance
        groq_client,
        auto_loop_interval: int = 300,   # seconds between autonomous ticks
    ):
        self.twins     = twins
        self.store     = feed_store
        self.groq      = groq_client
        self.interval  = auto_loop_interval
        self._loop_task: Optional[asyncio.Task] = None

    # ── Topic injection ───────────────────────────────────────────────────────

    def inject_topic(self, topic: str) -> list[dict]:
        """
        All 6 twins generate a post about the topic.
        Posts are added to the feed in a shuffled order with small delays.
        Returns list of post dicts.
        """
        log.info("Injecting topic: %s", topic)
        slugs   = SLUG_LIST.copy()
        random.shuffle(slugs)
        posts   = []

        for slug in slugs:
            twin = self.twins.get(slug)
            if not twin:
                continue
            # RAG context for this twin + topic
            context_str, chunks = twin._get_context(topic, top_k=5)
            try:
                content = twin.generate_post(topic, context=context_str)
            except Exception as exc:
                log.error("[%s] generate_post failed: %s", slug, exc)
                continue

            post = self.store.add_post(
                twin_slug=slug,
                twin_name=twin.name,
                content=content,
                topic=topic,
                source_chunks=chunks,
            )
            posts.append(post)
            time.sleep(0.3)   # stagger timestamps slightly

        log.info("Topic injected — %d posts generated", len(posts))
        return posts

    # ── Reaction generation ───────────────────────────────────────────────────

    def generate_reaction(self, post_id: str) -> Optional[dict]:
        """
        Pick the most likely twin to react to a post based on the relationship
        graph, generate a reply, and add it to the feed.
        """
        post = self.store.get_post(post_id)
        if not post:
            log.warning("generate_reaction: post %s not found", post_id)
            return None

        author_slug = post["twin_slug"]
        weights     = REACTION_WEIGHTS.get(author_slug, {})

        # Remove the author themselves
        weights = {s: w for s, w in weights.items() if s != author_slug}
        if not weights:
            return None

        # Avoid the same twin replying twice
        existing_replies = {r["twin_slug"] for r in self.store.get_replies(post_id)}
        weights = {s: w for s, w in weights.items() if s not in existing_replies}
        if not weights:
            return None

        reactor_slug = _weighted_pick(weights)
        reactor      = self.twins.get(reactor_slug)
        if not reactor:
            return None

        try:
            reply_content = reactor.generate_reply(
                post_content=post["content"],
                author_slug=author_slug,
                author_name=post["twin_name"],
            )
        except Exception as exc:
            log.error("[%s] generate_reply failed: %s", reactor_slug, exc)
            return None

        reply_post = self.store.add_post(
            twin_slug=reactor_slug,
            twin_name=reactor.name,
            content=reply_content,
            topic=post.get("topic", ""),
            reply_to_id=post_id,
        )
        log.info("[%s] replied to [%s] post %s", reactor_slug, author_slug, post_id[:8])
        return reply_post

    # ── Feed ──────────────────────────────────────────────────────────────────

    def get_feed(self, limit: int = 20) -> list[dict]:
        return self.store.get_feed(limit=limit)

    # ── Autonomous loop ───────────────────────────────────────────────────────

    async def run_autonomous_loop(self):
        """
        Background loop:
        1. Every `interval` seconds, fetch a trending topic from RSS
        2. Inject it — all 6 twins post
        3. Pick 2-3 posts and trigger reactions
        """
        log.info("Autonomous loop started (interval=%ds)", self.interval)
        while True:
            try:
                topics = await asyncio.get_event_loop().run_in_executor(
                    None, _fetch_rss_topics, 3
                )
                topic = random.choice(topics)
                log.info("[auto] Injecting topic: %s", topic[:80])

                posts = await asyncio.get_event_loop().run_in_executor(
                    None, self.inject_topic, topic
                )

                # Trigger reactions on 2-3 random posts
                react_count = min(random.randint(2, 3), len(posts))
                for post in random.sample(posts, react_count):
                    await asyncio.sleep(random.uniform(5, 15))
                    await asyncio.get_event_loop().run_in_executor(
                        None, self.generate_reaction, post["id"]
                    )

            except asyncio.CancelledError:
                log.info("Autonomous loop cancelled")
                break
            except Exception as exc:
                log.error("[auto] Loop iteration failed: %s", exc)

            await asyncio.sleep(self.interval)

    def start_autonomous_loop(self):
        if self._loop_task is None or self._loop_task.done():
            self._loop_task = asyncio.create_task(self.run_autonomous_loop())
            log.info("Autonomous loop task created")

    def stop_autonomous_loop(self):
        if self._loop_task and not self._loop_task.done():
            self._loop_task.cancel()
            log.info("Autonomous loop stopped")
