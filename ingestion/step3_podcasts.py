"""
ingestion/step3_podcasts.py
Find, download, and transcribe the top 10 podcast / long-form interview
appearances for each personality.

Search strategy: yt-dlp YouTube search for each query → filter for
videos longer than 30 minutes → pick top 10 → download audio + transcribe.

Outputs → /data/{slug}/podcasts/{video_id}.json
"""

import json
import subprocess
import sys
import tempfile
from pathlib import Path

from .config import DATA_DIR, PERSONALITIES
from .utils import get_logger, save_json
from .step1_youtube import download_audio, transcribe

log = get_logger("step3")

MIN_DURATION_SEC = 30 * 60   # 30 minutes
TOP_N_PODCASTS   = 10
RESULTS_PER_QUERY = 15        # fetch this many per query, then filter


def search_youtube(query: str, max_results: int) -> list[dict]:
    """Search YouTube and return video metadata via yt-dlp."""
    search_url = f"ytsearch{max_results}:{query}"
    cmd = [
        "yt-dlp",
        "--flat-playlist",
        "--dump-single-json",
        "--no-warnings",
        search_url,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
    if result.returncode != 0 or not result.stdout.strip():
        return []
    try:
        data = json.loads(result.stdout)
        return data.get("entries", [])
    except json.JSONDecodeError:
        return []


def filter_long_form(entries: list[dict]) -> list[dict]:
    """Keep only videos over MIN_DURATION_SEC."""
    return [e for e in entries if (e.get("duration") or 0) >= MIN_DURATION_SEC]


def collect_podcast_candidates(slug: str) -> list[dict]:
    cfg     = PERSONALITIES[slug]
    queries = cfg["podcast_queries"]
    seen    = set()
    results = []

    for query in queries:
        log.info(f"[{slug}]   Search: '{query}'")
        entries = search_youtube(query, RESULTS_PER_QUERY)
        long    = filter_long_form(entries)
        for e in long:
            vid_id = e.get("id", "")
            if vid_id and vid_id not in seen:
                seen.add(vid_id)
                results.append(e)
        if len(results) >= TOP_N_PODCASTS * 2:
            break

    # Sort by view count and take top N
    results.sort(key=lambda e: e.get("view_count") or 0, reverse=True)
    return results[:TOP_N_PODCASTS]


def run(slug: str) -> int:
    out_dir = DATA_DIR / slug / "podcasts"
    out_dir.mkdir(parents=True, exist_ok=True)

    log.info(f"[{slug}] === Step 3: Podcast / interview transcription ===")

    candidates = collect_podcast_candidates(slug)
    log.info(f"[{slug}] Found {len(candidates)} long-form candidates")

    saved = 0
    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        for entry in candidates:
            video_id = entry.get("id", "")
            title    = entry.get("title", "Unknown")
            date     = entry.get("upload_date", "")
            views    = entry.get("view_count", 0) or 0
            duration = entry.get("duration", 0) or 0

            out_file = out_dir / f"{video_id}.json"
            if out_file.exists():
                log.info(f"[{slug}]   SKIP (exists): {title[:60]}")
                saved += 1
                continue

            duration_min = round(duration / 60, 1)
            log.info(f"[{slug}]   Downloading ({duration_min}min, {views:,} views): {title[:55]}")

            try:
                audio_path = download_audio(video_id, tmp_path)
            except Exception as exc:
                log.warning(f"[{slug}]   Audio download failed for {video_id}: {exc}")
                continue

            try:
                transcript = transcribe(audio_path, slug)
            except Exception as exc:
                log.warning(f"[{slug}]   Transcription failed for {video_id}: {exc}")
                audio_path.unlink(missing_ok=True)
                continue

            audio_path.unlink(missing_ok=True)

            payload = {
                "video_id":         video_id,
                "video_title":      title,
                "publish_date":     f"{date[:4]}-{date[4:6]}-{date[6:]}" if len(date) == 8 else date,
                "view_count":       views,
                "duration_seconds": duration,
                "personality_slug": slug,
                "source_type":      "podcast",
                **transcript,
            }
            save_json(out_file, payload)
            log.info(f"[{slug}]   Saved {video_id}.json ({len(transcript['transcript_text'])} chars)")
            saved += 1

    log.info(f"[{slug}] Step 3 done — {saved}/{len(candidates)} podcasts transcribed")
    return saved


if __name__ == "__main__":
    slug = sys.argv[1] if len(sys.argv) > 1 else "mrbeast"
    run(slug)
