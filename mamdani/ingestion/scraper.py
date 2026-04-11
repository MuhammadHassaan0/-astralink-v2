"""
ingestion/scraper.py
Scrapes Mamdani content using two methods:
  1. Crawl4AI — direct URL scraping for official/bio pages
  2. Firecrawl agent — autonomous search + scraping for interview transcripts

Output saved to ingestion/raw_data/scraped.json (idempotent — skips already-scraped URLs).
"""

import asyncio
import json
import os
import sys
import re
from datetime import date
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from dotenv import load_dotenv

ROOT = Path(__file__).parent.parent
load_dotenv(ROOT / ".env")

FIRECRAWL_API_KEY = os.getenv("FIRECRAWL_API_KEY", "")

URLS = [
    {"url": "https://www.nyc.gov/mayors-office",                                                                                    "source_type": "official_site"},
    {"url": "https://www.nyc.gov/mayors-office/news",                                                                               "source_type": "official_site"},
    {"url": "https://www.nyc.gov/mayors-office/news/2026/04/mayor-mamdani-takes-bold--unapologetic-actions-to-protect-new-yo",      "source_type": "policy"},
    {"url": "https://en.wikipedia.org/wiki/Zohran_Mamdani",                                                                        "source_type": "biography"},
    {"url": "https://ballotpedia.org/Zohran_Mamdani",                                                                               "source_type": "biography"},
]

# ── Direct URLs to scrape via Firecrawl scrape (not agent) ────────────────────
INTERVIEW_URLS = [
    "https://nyeditorialboard.substack.com/p/zohran-mamdani-interview-transcript",
    "https://www.thecity.nyc/2026/01/08/mayor-mamdani-interview-city-hall-faqnyc-podcast/",
]

BLOCKED_HOSTS = {
    "news.google.com",
}

# ── Firecrawl agent prompt ────────────────────────────────────────────────────
AGENT_PROMPT = (
    "Find and extract full interview transcripts featuring Zohran Mamdani. "
    "Search for Zohran Mamdani YouTube interview transcripts and any major news "
    "interview transcripts published in 2024, 2025, or 2026. Return the complete "
    "spoken text of each interview, not summaries. Prioritise word-for-word transcripts."
)
AGENT_SEED_URLS = [
    "https://www.youtube.com/results?search_query=zohran+mamdani+interview+transcript",
]

OUTPUT_DIR  = Path(__file__).parent / "raw_data"
OUTPUT_FILE = OUTPUT_DIR / "scraped.json"

NOT_FOUND_SIGNALS = ["404", "not found", "page not found"]


def is_404(title: str, raw_text: str) -> bool:
    t = (title or "").lower()
    return any(s in t for s in NOT_FOUND_SIGNALS)


def load_existing() -> tuple[list[dict], set[str]]:
    if OUTPUT_FILE.exists():
        data = json.loads(OUTPUT_FILE.read_text())
        return data, {r["url"] for r in data}
    return [], set()


def save(records: list[dict]):
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.write_text(json.dumps(records, indent=2, ensure_ascii=False))


def extract_youtube_video_id(url: str) -> str | None:
    parsed = urlparse(url)
    host = (parsed.netloc or "").lower()

    if "youtu.be" in host:
        return parsed.path.strip("/") or None

    if "youtube.com" in host:
        video_id = parse_qs(parsed.query).get("v", [None])[0]
        if video_id:
            return video_id
        match = re.match(r"^/(shorts|embed)/([^/?#]+)", parsed.path or "")
        if match:
            return match.group(2)

    return None


def fetch_youtube_transcript(url: str) -> dict | None:
    """Return record-shaped transcript payload for a YouTube URL."""
    video_id = extract_youtube_video_id(url)
    if not video_id:
        return None

    try:
        from youtube_transcript_api import YouTubeTranscriptApi
        from youtube_transcript_api._errors import NoTranscriptFound, TranscriptsDisabled
    except Exception as e:
        print(f"    Transcript API unavailable — {e}")
        return None

    try:
        ytt = YouTubeTranscriptApi()
        fetched = ytt.fetch(video_id, languages=["en"])
        snippets = [sn.text.strip() for sn in fetched.snippets if sn.text and sn.text.strip()]
        text = "\n".join(snippets).strip()
        if len(text) < 300:
            return None

        return {
            "url":            url,
            "raw_text":       text,
            "source_type":    "interview",
            "title":          f"YouTube transcript ({video_id})",
            "is_404":         False,
            "scraped_at":     date.today().isoformat(),
            "speaker":        "Mamdani",
            "priority_score": 3,
            "transcript_api": "youtube-transcript-api",
        }
    except (NoTranscriptFound, TranscriptsDisabled) as e:
        print(f"    Transcript unavailable — {e}")
    except Exception as e:
        print(f"    Transcript ERROR — {e}")
    return None


# ── Section 1: Crawl4AI direct scraper ───────────────────────────────────────

async def crawl4ai_scrape(entries: list[dict]) -> list[dict]:
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
            skip_empty  = entry.get("skip_if_empty", False)
            print(f"  [Crawl4AI] {url}")
            try:
                result   = await crawler.arun(url=url, config=config)
                raw_text = result.markdown or ""
                title    = (result.metadata.get("title") or "") if result.metadata else ""

                if skip_empty and len(raw_text) < 500:
                    print(f"    SKIP — {len(raw_text)} chars (too short)")
                    continue

                flag = "  ⚠ 404" if is_404(title, raw_text) else ""
                print(f"    OK — {len(raw_text):,} chars{flag}")

                results.append({
                    "url":         url,
                    "raw_text":    raw_text,
                    "source_type": source_type,
                    "title":       title,
                    "is_404":      is_404(title, raw_text),
                    "scraped_at":  date.today().isoformat(),
                })
            except Exception as e:
                print(f"    ERROR — {e}")

    return results


# ── Section 2: Firecrawl direct scrape for known interview URLs ───────────────

def firecrawl_scrape_urls(urls: list[str], already_done: set[str]) -> list[dict]:
    if not FIRECRAWL_API_KEY:
        print("  [Firecrawl] No API key — skipping direct scrape")
        return []

    from firecrawl import V1FirecrawlApp
    fc      = V1FirecrawlApp(api_key=FIRECRAWL_API_KEY)
    results = []

    for url in urls:
        if url in already_done:
            print(f"  [Firecrawl scrape] SKIP (already done): {url}")
            continue
        print(f"  [Firecrawl scrape] {url}")
        host = (urlparse(url).netloc or "").lower()
        if "youtube.com" in host or "youtu.be" in host:
            yt_record = fetch_youtube_transcript(url)
            if yt_record:
                print(f"    OK — {len(yt_record['raw_text']):,} chars | YouTube transcript")
                results.append(yt_record)
            else:
                print("    SKIP — YouTube transcript unavailable")
            continue
        try:
            resp  = fc.scrape_url(url, formats=["markdown"], only_main_content=True)
            md    = getattr(resp, "markdown", None) or ""
            meta  = getattr(resp, "metadata", {}) or {}
            title = meta.get("title", "") if isinstance(meta, dict) else ""

            if len(md.strip()) < 200:
                print(f"    SKIP — {len(md)} chars (too short / blocked)")
                continue

            print(f"    OK — {len(md):,} chars | {title!r}")
            results.append({
                "url":            url,
                "raw_text":       md,
                "source_type":    "interview",
                "title":          title,
                "is_404":         False,
                "scraped_at":     date.today().isoformat(),
                "speaker":        "Mamdani",
                "priority_score": 3,
            })
        except Exception as e:
            print(f"    ERROR — {e}")

    return results


# ── Section 3: Firecrawl search + scrape — autonomous interview discovery ─────

def firecrawl_agent_scrape(already_done: set[str]) -> list[dict]:
    """
    Uses Firecrawl search() to find Mamdani interview pages, then scrape_url()
    on each result — equivalent to the 'agent' pattern but using the v1 SDK.
    """
    if not FIRECRAWL_API_KEY:
        print("  [Firecrawl search] No API key — skipping")
        return []

    from firecrawl import V1FirecrawlApp, V1ScrapeOptions
    fc = V1FirecrawlApp(api_key=FIRECRAWL_API_KEY)

    search_queries = [
        "Zohran Mamdani interview transcript full text 2024 2025 2026",
        "Zohran Mamdani YouTube interview transcript site:youtube.com OR site:rev.com",
    ]

    found_urls: list[str] = []
    for query in search_queries:
        print(f"  [Firecrawl search] Query: {query[:70]}...")
        try:
            resp = fc.search(
                query,
                limit=5,
                scrape_options=V1ScrapeOptions(formats=["markdown"]),
            )
            hits = getattr(resp, "data", []) or []
            print(f"    → {len(hits)} results")
            for hit in hits:
                url = getattr(hit, "url", None) or (hit.get("url") if isinstance(hit, dict) else None)
                host = (urlparse(url).netloc or "").lower() if url else ""
                if host in BLOCKED_HOSTS:
                    print(f"    SKIP host={host} (low-signal source)")
                    continue
                if url and url not in already_done and url not in found_urls:
                    found_urls.append(url)
        except Exception as e:
            print(f"    Search ERROR — {e}")

    print(f"  [Firecrawl search] Found {len(found_urls)} unique new URLs to scrape")

    records = []
    for url in found_urls:
        print(f"  [Firecrawl scrape] {url[:80]}")
        host = (urlparse(url).netloc or "").lower()
        if "youtube.com" in host or "youtu.be" in host:
            yt_record = fetch_youtube_transcript(url)
            if yt_record:
                print(f"    OK — {len(yt_record['raw_text']):,} chars | YouTube transcript")
                records.append(yt_record)
            else:
                print("    SKIP — YouTube transcript unavailable")
            continue
        try:
            resp  = fc.scrape_url(url, formats=["markdown"], only_main_content=True)
            md    = getattr(resp, "markdown", None) or ""
            meta  = getattr(resp, "metadata", {}) or {}
            title = meta.get("title", "") if isinstance(meta, dict) else ""

            if len(md.strip()) < 300:
                print(f"    SKIP — {len(md)} chars")
                continue

            print(f"    OK — {len(md):,} chars | {title!r}")
            records.append({
                "url":            url,
                "raw_text":       md,
                "source_type":    "interview",
                "title":          title,
                "is_404":         False,
                "scraped_at":     date.today().isoformat(),
                "speaker":        "Mamdani",
                "priority_score": 3,
            })
        except Exception as e:
            print(f"    Scrape ERROR — {e}")

    print(f"  [Firecrawl search] {len(records)} usable pages retrieved")
    return records


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("=== Mamdani Scraper ===\n")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    existing, already_done = load_existing()
    print(f"  Existing pages: {len(existing)} | Already-scraped URLs: {len(already_done)}\n")

    all_results = list(existing)
    total_new   = 0

    # ── 1. Crawl4AI for base URLs
    new_crawl_entries = [e for e in URLS if e["url"] not in already_done]
    if new_crawl_entries:
        print(f"── Crawl4AI: {len(new_crawl_entries)} new URLs ────────────────────────")
        crawl_results = asyncio.run(crawl4ai_scrape(new_crawl_entries))
        all_results.extend(crawl_results)
        already_done.update(r["url"] for r in crawl_results)
        total_new += len(crawl_results)
        print()
    else:
        print("── Crawl4AI: all base URLs already scraped\n")

    # ── 2. Firecrawl direct scrape for known interview URLs
    print("── Firecrawl direct scrape: known interview URLs ────────────────────")
    fc_direct = firecrawl_scrape_urls(INTERVIEW_URLS, already_done)
    all_results.extend(fc_direct)
    already_done.update(r["url"] for r in fc_direct)
    total_new += len(fc_direct)
    print()

    # ── 3. Firecrawl agent — autonomous interview discovery
    print("── Firecrawl agent: autonomous interview search ─────────────────────")
    fc_agent = firecrawl_agent_scrape(already_done)
    all_results.extend(fc_agent)
    total_new += len(fc_agent)
    print()

    # ── Save
    save(all_results)

    # ── Summary
    print("── Summary ──────────────────────────────────────────────────────────")
    total_chars = sum(len(r.get("raw_text", "")) for r in all_results)
    print(f"  New pages added:   {total_new}")
    print(f"  Total pages:       {len(all_results)}")
    print(f"  Total chars:       {total_chars:,}")
    print()
    print("  Per-page breakdown:")
    for r in all_results:
        chars = len(r.get("raw_text", ""))
        src   = r.get("source_type", "")
        print(f"    {chars:>10,} chars  [{src}]  {r['url'][:80]}")
    print(f"\n  Saved → {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
