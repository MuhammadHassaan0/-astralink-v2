"""
ingestion/step2_twitter.py
Scrape up to 3000 tweets per personality using snscrape (CLI mode).
Falls back to nitter RSS scraping if snscrape is unavailable.

Outputs → /data/{slug}/twitter/tweets.json
"""

import json
import re
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

import httpx

from .config import DATA_DIR, PERSONALITIES
from .utils import get_logger, save_json

log = get_logger("step2")

MAX_TWEETS   = 3000
NITTER_HOSTS = [
    "https://nitter.privacyredirect.com",
    "https://nitter.poast.org",
    "https://nitter.net",
]


# ── snscrape (subprocess CLI) ─────────────────────────────────────────────────

def _snscrape_available() -> bool:
    try:
        r = subprocess.run(["snscrape", "--version"], capture_output=True, timeout=10)
        return r.returncode == 0
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return False


def scrape_via_snscrape(handle: str, slug: str) -> list[dict]:
    log.info(f"[{slug}] Scraping via snscrape (user: {handle})")
    cmd = [
        "snscrape",
        "--jsonl",
        f"--max-results={MAX_TWEETS}",
        "twitter-user",
        handle,
    ]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
    except subprocess.TimeoutExpired:
        log.warning(f"[{slug}] snscrape timed out")
        return []

    tweets = []
    for line in result.stdout.splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            obj = json.loads(line)
        except json.JSONDecodeError:
            continue

        # Skip retweets
        if obj.get("retweetedTweet"):
            continue

        content = obj.get("rawContent") or obj.get("content", "")
        tweets.append({
            "tweet_id":   str(obj.get("id", "")),
            "text":       content,
            "date":       obj.get("date", ""),
            "likes":      obj.get("likeCount", 0) or 0,
            "retweets":   obj.get("retweetCount", 0) or 0,
        })

    log.info(f"[{slug}] snscrape returned {len(tweets)} tweets")
    return tweets


# ── Nitter RSS fallback ───────────────────────────────────────────────────────

def _parse_nitter_rss(xml: str) -> list[dict]:
    tweets = []
    items  = re.findall(r"<item>(.*?)</item>", xml, re.DOTALL)
    for item in items:
        def _tag(t: str) -> str:
            m = re.search(rf"<{t}[^>]*>(.*?)</{t}>", item, re.DOTALL)
            return m.group(1).strip() if m else ""

        title    = re.sub(r"<[^>]+>", "", _tag("title"))
        pub_date = _tag("pubDate")
        link     = _tag("link")
        tweet_id = link.rstrip("/").split("/")[-1].split("#")[0]

        # Skip retweets
        if title.startswith("RT "):
            continue

        # Parse date
        try:
            dt = datetime.strptime(pub_date, "%a, %d %b %Y %H:%M:%S %Z")
            date_str = dt.isoformat()
        except Exception:
            date_str = pub_date

        tweets.append({
            "tweet_id": tweet_id,
            "text":     title,
            "date":     date_str,
            "likes":    0,
            "retweets": 0,
        })
    return tweets


def scrape_via_nitter(handle: str, slug: str) -> list[dict]:
    log.info(f"[{slug}] Scraping via Nitter RSS (user: {handle})")
    all_tweets: list[dict] = []
    seen_ids: set[str]     = set()

    for host in NITTER_HOSTS:
        if len(all_tweets) >= MAX_TWEETS:
            break
        url = f"{host}/{handle}/rss"
        try:
            resp = httpx.get(url, timeout=20, follow_redirects=True)
            if resp.status_code != 200:
                log.warning(f"[{slug}]   {host} → HTTP {resp.status_code}")
                continue
            parsed = _parse_nitter_rss(resp.text)
            for t in parsed:
                if t["tweet_id"] not in seen_ids:
                    seen_ids.add(t["tweet_id"])
                    all_tweets.append(t)
            log.info(f"[{slug}]   {host} → {len(parsed)} tweets")
            time.sleep(1)
        except Exception as exc:
            log.warning(f"[{slug}]   {host} error: {exc}")
            continue

    log.info(f"[{slug}] Nitter total: {len(all_tweets)} tweets")
    return all_tweets[:MAX_TWEETS]


# ── Main ──────────────────────────────────────────────────────────────────────

def run(slug: str) -> int:
    cfg      = PERSONALITIES[slug]
    handle   = cfg["twitter_handle"]
    out_dir  = DATA_DIR / slug / "twitter"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / "tweets.json"

    log.info(f"[{slug}] === Step 2: Twitter scraping (@{handle}) ===")

    if out_file.exists():
        existing = json.loads(out_file.read_text())
        log.info(f"[{slug}] Already have {len(existing)} tweets — skipping")
        return len(existing)

    # Try snscrape first, fall back to nitter
    tweets: list[dict] = []
    if _snscrape_available():
        tweets = scrape_via_snscrape(handle, slug)
    else:
        log.info(f"[{slug}] snscrape not found, using Nitter RSS fallback")

    if not tweets:
        tweets = scrape_via_nitter(handle, slug)

    if not tweets:
        log.warning(f"[{slug}] No tweets collected — Twitter scraping blocked or unavailable")
        save_json(out_file, [])
        return 0

    # Normalise
    for t in tweets:
        t["personality_slug"] = slug
        t["source_type"]      = "twitter"

    save_json(out_file, tweets)
    log.info(f"[{slug}] Step 2 done — {len(tweets)} tweets saved")
    return len(tweets)


if __name__ == "__main__":
    slug = sys.argv[1] if len(sys.argv) > 1 else "mrbeast"
    run(slug)
