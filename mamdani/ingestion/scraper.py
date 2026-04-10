"""
ingestion/scraper.py
Scrapes Mamdani URLs using Crawl4AI and returns clean markdown.
Output saved to ingestion/raw_data/scraped.json
New URLs are appended; already-scraped URLs are skipped.
"""

import asyncio
import json
from pathlib import Path

from crawl4ai import AsyncWebCrawler, CrawlerRunConfig, CacheMode
from crawl4ai.async_configs import BrowserConfig

URLS = [
    {"url": "https://www.nyc.gov/mayors-office",                                                                                    "source_type": "official_site"},
    {"url": "https://www.nyc.gov/mayors-office/news",                                                                               "source_type": "official_site"},
    {"url": "https://www.nyc.gov/mayors-office/news/2026/04/mayor-mamdani-takes-bold--unapologetic-actions-to-protect-new-yo",      "source_type": "policy"},
    {"url": "https://en.wikipedia.org/wiki/Zohran_Mamdani",                                                                        "source_type": "biography"},
    {"url": "https://ballotpedia.org/Zohran_Mamdani",                                                                               "source_type": "biography"},
]

OUTPUT_DIR = Path(__file__).parent / "raw_data"
OUTPUT_FILE = OUTPUT_DIR / "scraped.json"

NOT_FOUND_SIGNALS = ["404", "not found", "page not found"]


def is_404(title: str, raw_text: str) -> bool:
    t = (title or "").lower()
    return any(s in t for s in NOT_FOUND_SIGNALS)


async def scrape_urls(entries: list[dict]) -> list[dict]:
    config = CrawlerRunConfig(
        cache_mode=CacheMode.BYPASS,
        wait_until="domcontentloaded",
        page_timeout=30000,
        delay_before_return_html=2.5,  # let JS render after DOM loads
    )
    browser_config = BrowserConfig(headless=True, java_script_enabled=True)
    results = []

    async with AsyncWebCrawler(config=browser_config) as crawler:
        for entry in entries:
            url = entry["url"]
            source_type = entry["source_type"]
            skip_if_empty = entry.get("skip_if_empty", False)
            print(f"  Scraping: {url}")
            try:
                result = await crawler.arun(url=url, config=config)
                raw_text = result.markdown or ""
                title = (result.metadata.get("title") or "") if result.metadata else ""

                if skip_if_empty and len(raw_text) < 500:
                    print(f"    SKIP — too little text ({len(raw_text)} chars), likely no scrapeable content")
                    continue

                flag = "  ⚠ 404" if is_404(title, raw_text) else ""
                print(f"    OK — {len(raw_text):,} chars | title: {title!r}{flag}")

                results.append({
                    "url": url,
                    "raw_text": raw_text,
                    "source_type": source_type,
                    "title": title,
                    "is_404": is_404(title, raw_text),
                })
            except Exception as e:
                print(f"    ERROR — {e}")
                results.append({
                    "url": url,
                    "raw_text": "",
                    "source_type": source_type,
                    "title": "",
                    "error": str(e),
                    "is_404": False,
                })

    return results


def main():
    print("=== Mamdani Scraper ===")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Load existing results and skip already-scraped URLs
    existing: list[dict] = []
    if OUTPUT_FILE.exists():
        existing = json.loads(OUTPUT_FILE.read_text())
    already_scraped = {r["url"] for r in existing}

    new_entries = [e for e in URLS if e["url"] not in already_scraped]
    if not new_entries:
        print("  All URLs already scraped. Nothing to do.")
        return

    print(f"  Skipping {len(already_scraped)} already-scraped URLs.")
    print(f"  Scraping {len(new_entries)} new URLs...\n")

    new_results = asyncio.run(scrape_urls(new_entries))

    all_results = existing + new_results
    OUTPUT_FILE.write_text(json.dumps(all_results, indent=2, ensure_ascii=False))

    # Summary
    print(f"\nPer-URL character counts (new only):")
    for r in new_results:
        chars = len(r.get("raw_text", ""))
        flag = " ⚠ 404" if r.get("is_404") else ""
        flag = flag or (" ✗ empty" if chars < 100 else "")
        print(f"  {'✓' if chars >= 100 else '✗'} {chars:>10,} chars  {r['url']}{flag}")

    new_scraped = sum(1 for r in new_results if r.get("raw_text"))
    new_chars = sum(len(r.get("raw_text", "")) for r in new_results)
    total_chars = sum(len(r.get("raw_text", "")) for r in all_results)

    print(f"\nDone.")
    print(f"  New pages scraped:   {new_scraped}/{len(new_entries)}")
    print(f"  New characters:      {new_chars:,}")
    print(f"  Total in file:       {len(all_results)} pages / {total_chars:,} chars")
    print(f"  Output saved to:     {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
