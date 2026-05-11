"""
ingestion/colter_scraper.py
Scrapes Colter Carlisle content from colterforla.com via Crawl4AI deep crawl
plus targeted individual pages and external sources.

Output saved to ingestion/raw_data/colter_scraped.json (idempotent).
"""

import asyncio
import json
import os
import sys
from datetime import date
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

OUTPUT_DIR  = Path(__file__).parent / "raw_data"
OUTPUT_FILE = OUTPUT_DIR / "colter_scraped.json"

CAMPAIGN_BASE = "https://www.colterforla.com"

# Known/likely pages to scrape individually as fallback / supplement
CAMPAIGN_PAGES = [
    {"url": "https://www.colterforla.com/",             "source_type": "campaign_site"},
    {"url": "https://www.colterforla.com/about",        "source_type": "campaign_site"},
    {"url": "https://www.colterforla.com/issues",       "source_type": "campaign_site"},
    {"url": "https://www.colterforla.com/platform",     "source_type": "campaign_site"},
    {"url": "https://www.colterforla.com/endorsements", "source_type": "campaign_site"},
    {"url": "https://www.colterforla.com/volunteer",    "source_type": "campaign_site"},
    {"url": "https://www.colterforla.com/contact",      "source_type": "campaign_site"},
]

EXTERNAL_URLS = [
    {
        "url": "https://easthollywoodnc.org/",
        "source_type": "neighborhood_council",
    },
]


def load_existing() -> tuple[list[dict], set[str]]:
    if OUTPUT_FILE.exists():
        data = json.loads(OUTPUT_FILE.read_text())
        return data, {r["url"] for r in data}
    return [], set()


def save(records: list[dict]):
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.write_text(json.dumps(records, indent=2, ensure_ascii=False))


async def deep_crawl_campaign(already_done: set[str]) -> list[dict]:
    """Deep crawl all pages of colterforla.com using Crawl4AI BFS."""
    from crawl4ai import AsyncWebCrawler, CrawlerRunConfig, CacheMode
    from crawl4ai.async_configs import BrowserConfig
    from crawl4ai.deep_crawling import BFSDeepCrawlStrategy

    print(f"  [Crawl4AI deep crawl] {CAMPAIGN_BASE}")

    config = CrawlerRunConfig(
        cache_mode=CacheMode.BYPASS,
        wait_until="domcontentloaded",
        page_timeout=30000,
        delay_before_return_html=2.0,
        deep_crawl_strategy=BFSDeepCrawlStrategy(
            max_depth=3,
            max_pages=50,
            include_external=False,
        ),
    )
    browser_config = BrowserConfig(headless=True, java_script_enabled=True)

    results = []
    try:
        async with AsyncWebCrawler(config=browser_config) as crawler:
            crawl_result = await crawler.arun(url=CAMPAIGN_BASE, config=config)
            pages = crawl_result if isinstance(crawl_result, list) else [crawl_result]
            for result in pages:
                url      = result.url
                raw_text = result.markdown or ""
                title    = (result.metadata.get("title") or "") if result.metadata else ""
                if url in already_done:
                    print(f"    SKIP (already done): {url}")
                    continue
                if len(raw_text.strip()) < 200:
                    print(f"    SKIP (too short, {len(raw_text)} chars): {url}")
                    continue
                print(f"    OK — {len(raw_text):,} chars | {url}")
                results.append({
                    "url":         url,
                    "raw_text":    raw_text,
                    "source_type": "campaign_site",
                    "title":       title,
                    "is_404":      False,
                    "scraped_at":  date.today().isoformat(),
                    "speaker":     "Colter",
                })
                already_done.add(url)
    except Exception as e:
        print(f"    [deep crawl] ERROR: {e}")
        print("    Falling back to individual page scraping...")

    print(f"  [deep crawl] {len(results)} pages collected")
    return results


async def scrape_pages(entries: list[dict], already_done: set[str]) -> list[dict]:
    """Scrape specific URLs via Crawl4AI."""
    from crawl4ai import AsyncWebCrawler, CrawlerRunConfig, CacheMode
    from crawl4ai.async_configs import BrowserConfig

    config = CrawlerRunConfig(
        cache_mode=CacheMode.BYPASS,
        wait_until="domcontentloaded",
        page_timeout=30000,
        delay_before_return_html=2.5,
    )
    browser_config = BrowserConfig(headless=True, java_script_enabled=True)
    results = []

    async with AsyncWebCrawler(config=browser_config) as crawler:
        for entry in entries:
            url         = entry["url"]
            source_type = entry["source_type"]
            if url in already_done:
                print(f"  SKIP (already done): {url}")
                continue
            print(f"  Scraping: {url}")
            try:
                result   = await crawler.arun(url=url, config=config)
                raw_text = result.markdown or ""
                title    = (result.metadata.get("title") or "") if result.metadata else ""
                if len(raw_text.strip()) < 200:
                    print(f"    SKIP — {len(raw_text)} chars (too short)")
                    continue
                print(f"    OK — {len(raw_text):,} chars | {title!r}")
                results.append({
                    "url":         url,
                    "raw_text":    raw_text,
                    "source_type": source_type,
                    "title":       title,
                    "is_404":      False,
                    "scraped_at":  date.today().isoformat(),
                    "speaker":     "Colter",
                })
                already_done.add(url)
            except Exception as e:
                print(f"    ERROR — {e}")

    return results


async def _run():
    print("=== Colter Carlisle Scraper ===\n")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    existing, already_done = load_existing()
    print(f"  Existing pages: {len(existing)} | Already scraped: {len(already_done)}\n")

    all_results = list(existing)

    # 1. Deep crawl campaign site
    print("── Deep crawl: colterforla.com ───────────────────────────────────────")
    deep_results = await deep_crawl_campaign(already_done)
    all_results.extend(deep_results)
    already_done.update(r["url"] for r in deep_results)
    print()

    # 2. Individual pages not yet covered by deep crawl
    remaining = [p for p in CAMPAIGN_PAGES if p["url"] not in already_done]
    if remaining:
        print("── Individual campaign pages (not yet scraped) ────────────────────────")
        page_results = await scrape_pages(remaining, already_done)
        all_results.extend(page_results)
        already_done.update(r["url"] for r in page_results)
        print()

    # 3. External sources
    print("── External sources ───────────────────────────────────────────────────")
    ext_results = await scrape_pages(EXTERNAL_URLS, already_done)
    all_results.extend(ext_results)
    print()

    save(all_results)

    print("── Summary ────────────────────────────────────────────────────────────")
    total_chars = sum(len(r.get("raw_text", "")) for r in all_results)
    print(f"  Total pages:   {len(all_results)}")
    print(f"  Total chars:   {total_chars:,}")
    for r in all_results:
        chars = len(r.get("raw_text", ""))
        src   = r.get("source_type", "")
        print(f"    {chars:>10,} chars  [{src}]  {r['url'][:80]}")
    print(f"\n  Saved → {OUTPUT_FILE}")


def main():
    asyncio.run(_run())


if __name__ == "__main__":
    main()
