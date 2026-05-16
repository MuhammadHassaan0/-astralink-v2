"""
ingestion/step4_chunker.py
Token-aware chunking of all collected content for a personality.

Chunking spec:
  - 200–350 tokens per chunk
  - 50 token overlap between consecutive chunks
  - Metadata per chunk: source_type, source_id, personality_slug, publish_date,
    topic_tags, is_opinion, is_about_another_creator

Outputs → /data/{slug}/chunks.json
"""

import re
import sys
import uuid
from pathlib import Path

import tiktoken

from .config import DATA_DIR, PERSONALITIES, ALL_CREATOR_NAMES, OTHER_CREATOR_NAMES
from .utils import get_logger, load_json, save_json

log  = get_logger("step4")
ENC  = tiktoken.get_encoding("cl100k_base")

CHUNK_MIN     = 200
CHUNK_MAX     = 350
OVERLAP_TOKENS = 50


# ── Tokenisation ──────────────────────────────────────────────────────────────

def token_count(text: str) -> int:
    return len(ENC.encode(text))


def encode(text: str) -> list[int]:
    return ENC.encode(text)


def decode(tokens: list[int]) -> str:
    return ENC.decode(tokens)


# ── Topic detection ───────────────────────────────────────────────────────────

TOPIC_KEYWORDS: dict[str, list[str]] = {
    "money":       ["money", "million", "billion", "revenue", "income", "earn", "rich", "wealth", "profit"],
    "success":     ["success", "successful", "achieve", "goals", "grind", "hustle", "win", "winning"],
    "competition": ["compete", "competition", "rival", "beat", "versus", "vs", "win against"],
    "fame":        ["famous", "celebrity", "viral", "trending", "subscribers", "followers", "views"],
    "business":    ["business", "brand", "company", "invest", "startup", "deal", "merch", "sponsor"],
    "social_media":["youtube", "twitter", "instagram", "tiktok", "stream", "streaming", "live"],
    "boxing":      ["boxing", "fight", "bout", "ring", "knockout", "KO", "training", "sparring"],
    "philanthropy":["charity", "donate", "help", "kids", "homeless", "food", "give", "philanthrop"],
    "gaming":      ["game", "gaming", "minecraft", "fortnite", "call of duty", "warzone", "stream"],
    "music":       ["music", "song", "rap", "album", "track", "lyrics", "beat", "fire"],
    "controversy": ["beef", "drama", "controversy", "cancelled", "apology", "banned", "suspended"],
    "family":      ["family", "parents", "mom", "dad", "brother", "sister", "sibling"],
}


def extract_topic_tags(text: str) -> list[str]:
    low  = text.lower()
    tags = [topic for topic, kws in TOPIC_KEYWORDS.items() if any(kw in low for kw in kws)]
    return tags or ["general"]


# ── Opinion / creator mention detection ──────────────────────────────────────

OPINION_MARKERS = [
    r"\bi think\b", r"\bmy opinion\b", r"\bi believe\b", r"\bi feel\b",
    r"\bpersonally\b", r"\bto me\b", r"\bhonestly\b", r"\btruth is\b",
    r"\bmy take\b", r"\bwhat i know\b", r"\bshould\b", r"\bwould\b",
]
_OPINION_RE = [re.compile(p, re.IGNORECASE) for p in OPINION_MARKERS]


def is_opinion(text: str) -> bool:
    return any(p.search(text) for p in _OPINION_RE)


def is_about_another_creator(text: str, slug: str) -> bool:
    """True if this chunk mentions any of the other 5 personalities."""
    own_names  = set(OTHER_CREATOR_NAMES.get(slug, []))
    other_names = [n for n in ALL_CREATOR_NAMES if n not in own_names]
    low = text.lower()
    return any(n.lower() in low for n in other_names)


# ── Sliding-window chunker ────────────────────────────────────────────────────

def chunk_text(text: str) -> list[str]:
    """Split text into overlapping token windows."""
    tokens  = encode(text)
    chunks  = []
    start   = 0
    total   = len(tokens)

    while start < total:
        end = min(start + CHUNK_MAX, total)
        chunk_tokens = tokens[start:end]
        chunk_text   = decode(chunk_tokens).strip()
        if token_count(chunk_text) >= CHUNK_MIN or start == 0:
            if chunk_text:
                chunks.append(chunk_text)
        if end >= total:
            break
        start = end - OVERLAP_TOKENS

    return chunks


# ── Per-source chunking ───────────────────────────────────────────────────────

def chunk_youtube_doc(doc: dict, slug: str) -> list[dict]:
    text = doc.get("transcript_text", "").strip()
    if not text:
        return []
    raw_chunks = chunk_text(text)
    result = []
    for raw in raw_chunks:
        result.append({
            "chunk_id":                  str(uuid.uuid4()),
            "source_type":               "youtube",
            "source_id":                 doc["video_id"],
            "personality_slug":          slug,
            "publish_date":              doc.get("publish_date", ""),
            "title":                     doc.get("video_title", ""),
            "text":                      raw,
            "topic_tags":                extract_topic_tags(raw),
            "is_opinion":                is_opinion(raw),
            "is_about_another_creator":  is_about_another_creator(raw, slug),
            "token_count":               token_count(raw),
        })
    return result


def chunk_podcast_doc(doc: dict, slug: str) -> list[dict]:
    text = doc.get("transcript_text", "").strip()
    if not text:
        return []
    raw_chunks = chunk_text(text)
    result = []
    for raw in raw_chunks:
        result.append({
            "chunk_id":                  str(uuid.uuid4()),
            "source_type":               "podcast",
            "source_id":                 doc["video_id"],
            "personality_slug":          slug,
            "publish_date":              doc.get("publish_date", ""),
            "title":                     doc.get("video_title", ""),
            "text":                      raw,
            "topic_tags":                extract_topic_tags(raw),
            "is_opinion":                is_opinion(raw),
            "is_about_another_creator":  is_about_another_creator(raw, slug),
            "token_count":               token_count(raw),
        })
    return result


def chunk_tweet(tweet: dict, slug: str) -> dict | None:
    text = tweet.get("text", "").strip()
    if not text or len(text) < 10:
        return None
    return {
        "chunk_id":                  str(uuid.uuid4()),
        "source_type":               "twitter",
        "source_id":                 tweet.get("tweet_id", ""),
        "personality_slug":          slug,
        "publish_date":              tweet.get("date", "")[:10],
        "title":                     "",
        "text":                      text,
        "topic_tags":                extract_topic_tags(text),
        "is_opinion":                is_opinion(text),
        "is_about_another_creator":  is_about_another_creator(text, slug),
        "token_count":               token_count(text),
        "tweet_likes":               tweet.get("likes", 0),
        "tweet_retweets":            tweet.get("retweets", 0),
    }


# ── Main ──────────────────────────────────────────────────────────────────────

def run(slug: str) -> int:
    base     = DATA_DIR / slug
    out_file = base / "chunks.json"

    log.info(f"[{slug}] === Step 4: Chunking ===")
    all_chunks: list[dict] = []

    # YouTube
    yt_dir = base / "youtube"
    yt_count = 0
    for jf in sorted(yt_dir.glob("*.json")):
        try:
            doc    = load_json(jf)
            chunks = chunk_youtube_doc(doc, slug)
            all_chunks.extend(chunks)
            yt_count += len(chunks)
        except Exception as exc:
            log.warning(f"[{slug}]   YouTube chunk error {jf.name}: {exc}")
    log.info(f"[{slug}]   YouTube → {yt_count} chunks")

    # Podcasts
    pod_dir = base / "podcasts"
    pod_count = 0
    for jf in sorted(pod_dir.glob("*.json")):
        try:
            doc    = load_json(jf)
            chunks = chunk_podcast_doc(doc, slug)
            all_chunks.extend(chunks)
            pod_count += len(chunks)
        except Exception as exc:
            log.warning(f"[{slug}]   Podcast chunk error {jf.name}: {exc}")
    log.info(f"[{slug}]   Podcasts → {pod_count} chunks")

    # Twitter
    tw_file = base / "twitter" / "tweets.json"
    tw_count = 0
    if tw_file.exists():
        try:
            tweets = load_json(tw_file)
            for tweet in tweets:
                chunk = chunk_tweet(tweet, slug)
                if chunk:
                    all_chunks.append(chunk)
                    tw_count += 1
        except Exception as exc:
            log.warning(f"[{slug}]   Twitter chunk error: {exc}")
    log.info(f"[{slug}]   Twitter → {tw_count} chunks")

    save_json(out_file, all_chunks)
    log.info(f"[{slug}] Step 4 done — {len(all_chunks)} total chunks saved")
    return len(all_chunks)


if __name__ == "__main__":
    slug = sys.argv[1] if len(sys.argv) > 1 else "mrbeast"
    run(slug)
