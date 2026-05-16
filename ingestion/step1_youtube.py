"""
ingestion/step1_youtube.py
Download audio from top-30 most-viewed YouTube videos per personality
and transcribe with faster-whisper base.

Outputs → /data/{slug}/youtube/{video_id}.json  (one file per video)
"""

import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

from .config import DATA_DIR, PERSONALITIES
from .utils import get_logger, save_json

log = get_logger("step1")

AUDIO_FORMAT   = "bestaudio/best"
AUDIO_EXT      = "mp3"
WHISPER_MODEL  = "base"
TOP_N          = 30


# ── yt-dlp helpers ────────────────────────────────────────────────────────────

def _ytdlp(*args: str) -> str:
    cmd = ["yt-dlp", *args]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
    if result.returncode != 0:
        raise RuntimeError(f"yt-dlp error: {result.stderr[:400]}")
    return result.stdout


def fetch_channel_videos(channel_url: str, slug: str) -> list[dict]:
    """Return all video metadata (flat) from a channel, sorted by view count desc."""
    log.info(f"[{slug}] Fetching channel video list from {channel_url}")
    raw = _ytdlp(
        "--flat-playlist",
        "--dump-single-json",
        "--no-warnings",
        channel_url,
    )
    data = json.loads(raw)
    entries = data.get("entries", [])
    log.info(f"[{slug}] Found {len(entries)} videos in channel")

    # Sort by view_count descending; default to 0 if missing
    entries.sort(key=lambda e: e.get("view_count") or 0, reverse=True)
    return entries[:TOP_N]


def download_audio(video_id: str, out_dir: Path) -> Path:
    """Download audio-only for a video. Returns path to downloaded file."""
    url = f"https://www.youtube.com/watch?v={video_id}"
    out_tmpl = str(out_dir / f"{video_id}.%(ext)s")
    _ytdlp(
        "-f", AUDIO_FORMAT,
        "-x",
        "--audio-format", AUDIO_EXT,
        "--audio-quality", "0",
        "--no-playlist",
        "--no-warnings",
        "-o", out_tmpl,
        url,
    )
    # Find the downloaded file
    matches = list(out_dir.glob(f"{video_id}.*"))
    if not matches:
        raise FileNotFoundError(f"Audio not found for {video_id}")
    return matches[0]


# ── Whisper transcription ─────────────────────────────────────────────────────

def transcribe(audio_path: Path, slug: str) -> dict:
    """Transcribe audio with faster-whisper. Returns transcript dict."""
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        raise ImportError("faster-whisper not installed. Run: pip install faster-whisper")

    log.info(f"[{slug}] Transcribing {audio_path.name} with {WHISPER_MODEL}...")
    model = WhisperModel(WHISPER_MODEL, device="cpu", compute_type="int8")
    segments, info = model.transcribe(
        str(audio_path),
        beam_size=5,
        word_timestamps=True,
        language="en",
    )

    transcript_text = ""
    word_timestamps = []

    for seg in segments:
        transcript_text += seg.text + " "
        if seg.words:
            for word in seg.words:
                word_timestamps.append({
                    "word":  word.word.strip(),
                    "start": round(word.start, 3),
                    "end":   round(word.end, 3),
                })

    return {
        "transcript_text":  transcript_text.strip(),
        "word_timestamps":  word_timestamps,
        "duration_seconds": round(info.duration, 1) if info else None,
        "language":         info.language if info else "en",
    }


# ── Main ──────────────────────────────────────────────────────────────────────

def run(slug: str) -> int:
    cfg       = PERSONALITIES[slug]
    out_dir   = DATA_DIR / slug / "youtube"
    out_dir.mkdir(parents=True, exist_ok=True)

    log.info(f"[{slug}] === Step 1: YouTube transcription ===")

    try:
        top_videos = fetch_channel_videos(cfg["youtube_channel"], slug)
    except Exception as exc:
        log.error(f"[{slug}] Failed to fetch channel: {exc}")
        return 0

    saved = 0
    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        for entry in top_videos:
            video_id = entry.get("id") or entry.get("url", "").split("=")[-1]
            title    = entry.get("title", "Unknown")
            date     = entry.get("upload_date", "")
            views    = entry.get("view_count", 0)

            out_file = out_dir / f"{video_id}.json"
            if out_file.exists():
                log.info(f"[{slug}]   SKIP (exists): {title[:60]}")
                saved += 1
                continue

            log.info(f"[{slug}]   Downloading: [{views:,} views] {title[:60]}")
            try:
                audio_path = download_audio(video_id, tmp_path)
            except Exception as exc:
                log.warning(f"[{slug}]   Download failed for {video_id}: {exc}")
                continue

            try:
                transcript = transcribe(audio_path, slug)
            except Exception as exc:
                log.warning(f"[{slug}]   Transcription failed for {video_id}: {exc}")
                audio_path.unlink(missing_ok=True)
                continue

            # Clean up audio to save disk space
            audio_path.unlink(missing_ok=True)

            payload = {
                "video_id":       video_id,
                "video_title":    title,
                "publish_date":   f"{date[:4]}-{date[4:6]}-{date[6:]}" if len(date) == 8 else date,
                "view_count":     views,
                "personality_slug": slug,
                "source_type":    "youtube",
                **transcript,
            }
            save_json(out_file, payload)
            log.info(f"[{slug}]   Saved {video_id}.json ({len(transcript['transcript_text'])} chars)")
            saved += 1

    log.info(f"[{slug}] Step 1 done — {saved}/{len(top_videos)} videos transcribed")
    return saved


if __name__ == "__main__":
    slug = sys.argv[1] if len(sys.argv) > 1 else "mrbeast"
    run(slug)
