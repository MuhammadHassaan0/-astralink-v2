"""
ingestion/step6_profile.py
Run a summarisation pass over each personality's full corpus using
Groq llama-3.3-70b-versatile and extract a structured profile.json.

Output → /data/{slug}/profile.json
"""

import json
import sys
import time
from pathlib import Path

from groq import Groq

from .config import DATA_DIR, PERSONALITIES, GROQ_MODEL, SLUG_LIST
from .utils import get_env, get_logger, load_json, save_json

log = get_logger("step6")

MAX_CONTEXT_CHARS  = 80_000   # send this many chars of corpus to the LLM
CHUNK_SAMPLE_COUNT = 200      # max chunks to sample for the summarisation prompt


PROFILE_SCHEMA = """
{
  "personality_slug": "<slug>",
  "name": "<display name>",
  "core_traits": ["<word1>", "<word2>", "<word3>", "<word4>", "<word5>"],
  "opinions": {
    "money":         "<their documented stance in 1-2 sentences>",
    "success":       "<their documented stance>",
    "competition":   "<their documented stance>",
    "other_creators":"<their documented stance>",
    "fame":          "<their documented stance>",
    "business":      "<their documented stance>",
    "social_media":  "<their documented stance>"
  },
  "relationships": {
    "mrbeast":    {"sentiment": "positive|negative|neutral|competitive|friendly", "evidence": "<source>", "detail": "<1 sentence>"},
    "ishowspeed": {"sentiment": "...", "evidence": "...", "detail": "..."},
    "kaicenat":   {"sentiment": "...", "evidence": "...", "detail": "..."},
    "ksi":        {"sentiment": "...", "evidence": "...", "detail": "..."},
    "loganpaul":  {"sentiment": "...", "evidence": "...", "detail": "..."},
    "jakepaul":   {"sentiment": "...", "evidence": "...", "detail": "..."}
  },
  "recurring_phrases": ["<phrase1>", "<phrase2>", "<phrase3>"],
  "top_topics": ["<topic1>", "<topic2>", "<topic3>", "<topic4>", "<topic5>"],
  "avoided_topics": ["<topic1>", "<topic2>"],
  "known_beefs": [
    {
      "with": "<name>",
      "description": "<1-2 sentences>",
      "status": "ongoing|resolved|unclear",
      "approximate_date": "<year or year range>"
    }
  ],
  "speech_patterns": {
    "energy_level": "high|medium|low",
    "emoji_usage": "heavy|moderate|minimal|none",
    "vocabulary": "<brief description>",
    "typical_punctuation": "<description>"
  }
}
"""


def sample_corpus(slug: str) -> str:
    """Build a text sample from the personality's collected content."""
    base   = DATA_DIR / slug
    parts  = []

    # Sample from YouTube transcripts
    yt_dir = base / "youtube"
    yt_files = sorted(yt_dir.glob("*.json"))[:15]
    for f in yt_files:
        try:
            doc  = load_json(f)
            text = doc.get("transcript_text", "")[:3000]
            parts.append(f"[YouTube: {doc.get('video_title','')[:60]}]\n{text}")
        except Exception:
            pass

    # Sample from podcasts
    pod_dir = base / "podcasts"
    pod_files = sorted(pod_dir.glob("*.json"))[:5]
    for f in pod_files:
        try:
            doc  = load_json(f)
            text = doc.get("transcript_text", "")[:4000]
            parts.append(f"[Podcast: {doc.get('video_title','')[:60]}]\n{text}")
        except Exception:
            pass

    # Sample tweets
    tw_file = base / "twitter" / "tweets.json"
    if tw_file.exists():
        try:
            tweets = load_json(tw_file)[:100]
            tweet_block = "\n".join(f"- {t['text'][:200]}" for t in tweets if t.get("text"))
            parts.append(f"[Tweets sample]\n{tweet_block}")
        except Exception:
            pass

    corpus = "\n\n".join(parts)
    return corpus[:MAX_CONTEXT_CHARS]


def extract_profile(slug: str, client: Groq) -> dict:
    cfg    = PERSONALITIES[slug]
    corpus = sample_corpus(slug)

    if not corpus.strip():
        log.warning(f"[{slug}] No corpus content found — profile will be minimal")
        corpus = f"Creator: {cfg['name']} ({cfg['full_name']})"

    # Remove self from relationship list
    other_slugs = [s for s in SLUG_LIST if s != slug]

    prompt = f"""You are analysing publicly documented content from {cfg['name']} ({cfg['full_name']}).
Below is a sample of their YouTube transcripts, podcast appearances, and tweets.

Based ONLY on the documented evidence below, extract a personality profile in the exact JSON schema provided.
Never invent or hallucinate facts. If you have no documented evidence for a field, write "undocumented" or leave as an empty list.
For relationships with other creators, only include: {', '.join(other_slugs)} — do not include "{slug}" itself.

--- CORPUS SAMPLE ---
{corpus}
--- END CORPUS ---

Return ONLY valid JSON matching this exact schema (no markdown, no explanation):
{PROFILE_SCHEMA}

Replace the slug with "{slug}" and name with "{cfg['name']}".
For the relationships object, include exactly these keys: {', '.join(other_slugs)}
"""

    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        max_tokens=4096,
    )

    raw = response.choices[0].message.content.strip()

    # Strip markdown code fences if present
    if raw.startswith("```"):
        raw = raw.split("```", 2)[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.rsplit("```", 1)[0]

    try:
        profile = json.loads(raw.strip())
    except json.JSONDecodeError as exc:
        log.error(f"[{slug}] JSON parse error: {exc}\nRaw:\n{raw[:500]}")
        profile = {
            "personality_slug": slug,
            "name":             cfg["name"],
            "parse_error":      str(exc),
            "raw_response":     raw[:2000],
        }

    profile["personality_slug"] = slug
    profile["name"]             = cfg["name"]
    return profile


def run(slug: str) -> bool:
    out_file = DATA_DIR / slug / "profile.json"

    log.info(f"[{slug}] === Step 6: Profile extraction ===")

    groq_key = get_env("GROQ_API_KEY")
    client   = Groq(api_key=groq_key)

    try:
        profile = extract_profile(slug, client)
        save_json(out_file, profile)
        log.info(f"[{slug}] Profile saved → {out_file}")
        return True
    except Exception as exc:
        log.error(f"[{slug}] Profile extraction failed: {exc}")
        return False


if __name__ == "__main__":
    slug = sys.argv[1] if len(sys.argv) > 1 else "mrbeast"
    run(slug)
