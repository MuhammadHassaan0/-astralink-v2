"""
kai/ingestion/scraper.py
Scrape public web sources about Kai Trump using Crawl4AI.
Appends to raw_data/scraped.json (idempotent — skips already-scraped URLs).

Usage:
    python3.12 ingestion/scraper.py
"""

import asyncio
import json
import sys
from datetime import date
from pathlib import Path

# ── Crawl4AI requires Python 3.12+ (uses X|None union syntax) ────────────────
if sys.version_info < (3, 12):
    raise RuntimeError("Python 3.12+ required for Crawl4AI")

from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig

# ── Paths ─────────────────────────────────────────────────────────────────────
ROOT      = Path(__file__).parent.parent
OUT_FILE  = ROOT / "ingestion" / "raw_data" / "scraped.json"
OUT_FILE.parent.mkdir(parents=True, exist_ok=True)

# ── Target URLs ───────────────────────────────────────────────────────────────
URLS = [
    {
        "url":           "https://en.wikipedia.org/wiki/Kai_Trump",
        "source_type":   "wikipedia",
        "skip_if_empty": False,
        "wait_until":    "domcontentloaded",
    },
    {
        "url":           "https://www.instagram.com/kaitrump/",
        "source_type":   "social_media",
        "skip_if_empty": True,
        "wait_until":    "domcontentloaded",
    },
    {
        "url":           "https://www.tiktok.com/@kaitrump",
        "source_type":   "social_media",
        "skip_if_empty": True,
        "wait_until":    "domcontentloaded",
    },
    {
        "url":           "https://news.google.com/search?q=Kai+Trump&hl=en-US&gl=US&ceid=US%3Aen",
        "source_type":   "news",
        "skip_if_empty": False,
        "wait_until":    "domcontentloaded",
    },
    {
        "url":           "https://people.com/kai-trump/",
        "source_type":   "news",
        "skip_if_empty": False,
        "wait_until":    "domcontentloaded",
    },
]


def is_404(markdown: str) -> bool:
    low = (markdown or "").lower()
    markers = ["404", "page not found", "not found", "does not exist",
               "no longer available", "error 404"]
    return any(m in low for m in markers)


def load_existing() -> list[dict]:
    if OUT_FILE.exists():
        try:
            return json.loads(OUT_FILE.read_text())
        except Exception:
            return []
    return []


async def scrape_all():
    existing     = load_existing()
    already_done = {r["url"] for r in existing}
    results      = list(existing)

    browser_cfg = BrowserConfig(headless=True, verbose=False)

    async with AsyncWebCrawler(config=browser_cfg) as crawler:
        for entry in URLS:
            url         = entry["url"]
            source_type = entry["source_type"]
            skip_empty  = entry["skip_if_empty"]
            wait_until  = entry.get("wait_until", "domcontentloaded")

            if url in already_done:
                print(f"  SKIP (already scraped): {url}")
                continue

            print(f"  Scraping: {url}")
            try:
                run_cfg = CrawlerRunConfig(
                    wait_until=wait_until,
                    delay_before_return_html=2.5,
                    page_timeout=30000,
                )
                result = await crawler.arun(url=url, config=run_cfg)
                md     = result.markdown or ""

                if is_404(md):
                    print(f"    → 404/not found, skipping")
                    continue

                if skip_empty and len(md.strip()) < 200:
                    print(f"    → Too short ({len(md)} chars), skipping")
                    continue

                char_count = len(md)
                print(f"    → {char_count:,} chars")

                title = ""
                if result.metadata:
                    title = (result.metadata.get("title") or "") if result.metadata else ""

                results.append({
                    "url":         url,
                    "source_type": source_type,
                    "title":       title,
                    "scraped_at":  date.today().isoformat(),
                    "char_count":  char_count,
                    "markdown":    md,
                })

            except Exception as e:
                print(f"    → ERROR: {e}")

    OUT_FILE.write_text(json.dumps(results, indent=2, ensure_ascii=False))
    total = sum(r.get("char_count", 0) for r in results)
    print(f"\n  Saved {len(results)} pages ({total:,} total chars) → {OUT_FILE}")


if __name__ == "__main__":
    asyncio.run(scrape_all())
