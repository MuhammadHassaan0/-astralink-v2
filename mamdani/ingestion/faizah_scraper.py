"""
ingestion/faizah_scraper.py
Scrapes Faizah Malik content using Crawl4AI deep crawl + targeted external sources.

Sources:
  1. Crawl4AI deep crawl of faizahforla.com (all pages)
  2. LAist 2026 voter guide
  3. Patch 2026 candidate profile
  4. Eastsider LA candidate article

Output saved to ingestion/raw_data/faizah_scraped.json (idempotent).
"""

import asyncio
import json
import os
import sys
from datetime import date
from pathlib import Path
from urllib.parse import urljoin, urlparse

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

OUTPUT_DIR  = Path(__file__).parent / "raw_data"
OUTPUT_FILE = OUTPUT_DIR / "faizah_scraped.json"

# Campaign site — all known pages (discovered via initial deep crawl)
CAMPAIGN_BASE = "https://www.faizahforla.com"
CAMPAIGN_PAGES = [
    {"url": "https://www.faizahforla.com/",                                   "source_type": "campaign_site"},
    {"url": "https://www.faizahforla.com/meet-faizah",                        "source_type": "campaign_site"},
    {"url": "https://www.faizahforla.com/housing-tenants-rights",             "source_type": "campaign_site"},
    {"url": "https://www.faizahforla.com/homelessness",                       "source_type": "campaign_site"},
    {"url": "https://www.faizahforla.com/climate",                            "source_type": "campaign_site"},
    {"url": "https://www.faizahforla.com/community-safety",                   "source_type": "campaign_site"},
    {"url": "https://www.faizahforla.com/transparent-accountable-government", "source_type": "campaign_site"},
    {"url": "https://www.faizahforla.com/transportation",                     "source_type": "campaign_site"},
    {"url": "https://www.faizahforla.com/immigrants-rights",                  "source_type": "campaign_site"},
    {"url": "https://www.faizahforla.com/economy-for-all",                    "source_type": "campaign_site"},
    {"url": "https://www.faizahforla.com/fire-recovery",                      "source_type": "campaign_site"},
    {"url": "https://www.faizahforla.com/community-resources",                "source_type": "campaign_site"},
    {"url": "https://www.faizahforla.com/policy",                             "source_type": "campaign_site"},
    {"url": "https://www.faizahforla.com/policy-1",                           "source_type": "campaign_site"},
    {"url": "https://www.faizahforla.com/press",                              "source_type": "campaign_site"},
    {"url": "https://www.faizahforla.com/endorsements",                       "source_type": "campaign_site"},
]

# External sources — scraped directly
EXTERNAL_URLS = [
    {
        "url": "https://laist.com/news/politics/voter-guides/2026-election-california-primary-la-city-councilmember-district-11",
        "source_type": "voter_guide",
    },
    {
        "url": "https://patch.com/california/los-angeles/meet-faizah-malik-candidate-los-angeles-city-council-district-11",
        "source_type": "candidate_profile",
    },
    {
        "url": "https://www.theeastsiderla.com/news/heres-who-is-going-to-make-a-run-for-l-a-city-council/article_bb9478a2-1c40-46bb-bef2-527ecc1e066f.html",
        "source_type": "news",
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


def is_same_domain(url: str, base: str) -> bool:
    return urlparse(url).netloc == urlparse(base).netloc


async def deep_crawl_campaign(already_done: set[str]) -> list[dict]:
    """Deep crawl all pages of faizahforla.com using Crawl4AI."""
    from crawl4ai import AsyncWebCrawler, CrawlerRunConfig, CacheMode
    from crawl4ai.async_configs import BrowserConfig
    from crawl4ai.deep_crawling import BFSDeepCrawlStrategy

    print(f"  [Crawl4AI deep crawl] {CAMPAIGN_BASE}")

    config = CrawlerRunConfig(
        cache_mode=CacheMode.BYPASS,
        wait_until="domcontentloaded",
        page_timeout=30000,
        delay_before_return_html=1.5,
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
            async for result in await crawler.arun(url=CAMPAIGN_BASE, config=config):
                url = result.url
                if url in already_done:
                    print(f"    SKIP (already done): {url}")
                    continue
                raw_text = result.markdown or ""
                title    = (result.metadata.get("title") or "") if result.metadata else ""
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
                    "speaker":     "Faizah",
                })
                already_done.add(url)
    except Exception as e:
        print(f"    [deep crawl] ERROR: {e}")
        # Fallback: scrape just the base URL
        try:
            config_simple = CrawlerRunConfig(
                cache_mode=CacheMode.BYPASS,
                wait_until="domcontentloaded",
                page_timeout=30000,
                delay_before_return_html=2.0,
            )
            async with AsyncWebCrawler(config=browser_config) as crawler2:
                result = await crawler2.arun(url=CAMPAIGN_BASE, config=config_simple)
                raw_text = result.markdown or ""
                title    = (result.metadata.get("title") or "") if result.metadata else ""
                if len(raw_text.strip()) >= 200 and CAMPAIGN_BASE not in already_done:
                    print(f"    Fallback OK — {len(raw_text):,} chars")
                    results.append({
                        "url":         CAMPAIGN_BASE,
                        "raw_text":    raw_text,
                        "source_type": "campaign_site",
                        "title":       title,
                        "is_404":      False,
                        "scraped_at":  date.today().isoformat(),
                        "speaker":     "Faizah",
                    })
        except Exception as e2:
            print(f"    Fallback ERROR: {e2}")

    print(f"  [deep crawl] {len(results)} pages collected from campaign site")
    return results


async def scrape_external(entries: list[dict], already_done: set[str]) -> list[dict]:
    """Scrape specific external URLs via Crawl4AI."""
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
                print(f"  [external] SKIP (already done): {url}")
                continue
            print(f"  [external] {url}")
            try:
                result   = await crawler.arun(url=url, config=config)
                raw_text = result.markdown or ""
                title    = (result.metadata.get("title") or "") if result.metadata else ""
                if len(raw_text.strip()) < 300:
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
                    "speaker":     "Faizah",
                })
            except Exception as e:
                print(f"    ERROR — {e}")

    return results


async def _run():
    print("=== Faizah Scraper ===\n")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    existing, already_done = load_existing()
    print(f"  Existing pages: {len(existing)} | Already scraped: {len(already_done)}\n")

    all_results = list(existing)

    # 1. Scrape all known campaign pages individually
    print("── Campaign pages: faizahforla.com ───────────────────────────────────")
    campaign_results = await scrape_external(CAMPAIGN_PAGES, already_done)
    all_results.extend(campaign_results)
    already_done.update(r["url"] for r in campaign_results)
    print()

    # 2. External sources
    print("── External sources ──────────────────────────────────────────────────")
    ext_results = await scrape_external(EXTERNAL_URLS, already_done)
    all_results.extend(ext_results)
    print()

    save(all_results)

    print("── Summary ───────────────────────────────────────────────────────────")
    total_chars = sum(len(r.get("raw_text", "")) for r in all_results)
    print(f"  Total pages:   {len(all_results)}")
    print(f"  Total chars:   {total_chars:,}")
    print()
    for r in all_results:
        chars = len(r.get("raw_text", ""))
        src   = r.get("source_type", "")
        print(f"    {chars:>10,} chars  [{src}]  {r['url'][:80]}")
    print(f"\n  Saved → {OUTPUT_FILE}")


def main():
    asyncio.run(_run())


if __name__ == "__main__":
    main()
