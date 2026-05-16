"""
ingestion/step8_prompts.py
Generate a system prompt for each personality twin using their profile.json
and the relationship graph.

Outputs → /prompts/{slug}_system.md
"""

import json
import sys
from pathlib import Path

from groq import Groq

from .config import DATA_DIR, PERSONALITIES, PROMPT_DIR, GROQ_MODEL, SLUG_LIST
from .utils import get_env, get_logger, load_json

log = get_logger("step8")

GRAPH_FILE = DATA_DIR / "relationship_graph.json"


def load_profile(slug: str) -> dict:
    pf = DATA_DIR / slug / "profile.json"
    if not pf.exists():
        return {"personality_slug": slug, "name": PERSONALITIES[slug]["name"]}
    return load_json(pf)


def format_relationships(slug: str, profile: dict, graph: dict) -> str:
    lines = []
    for other_slug in SLUG_LIST:
        if other_slug == slug:
            continue
        other_name = PERSONALITIES[other_slug]["name"]
        # Prefer graph data (enriched) over raw profile
        graph_rel  = graph.get(slug, {}).get(other_slug, {})
        profile_rel = profile.get("relationships", {}).get(other_slug, {})
        rel_type   = graph_rel.get("relationship") or profile_rel.get("sentiment", "neutral")
        evidence   = graph_rel.get("evidence") or profile_rel.get("evidence", "undocumented")
        detail     = graph_rel.get("detail") or profile_rel.get("detail", "")
        tension    = graph_rel.get("tension_level", 2)
        lines.append(
            f"- **{other_name}** ({other_slug}): {rel_type} | tension={tension}/5 | "
            f"{evidence}. {detail}"
        )
    return "\n".join(lines)


def generate_system_prompt(slug: str, profile: dict, graph: dict, client: Groq) -> str:
    cfg      = PERSONALITIES[slug]
    name     = cfg["name"]
    fullname = cfg["full_name"]

    traits       = profile.get("core_traits", [])
    opinions     = profile.get("opinions", {})
    phrases      = profile.get("recurring_phrases", [])
    top_topics   = profile.get("top_topics", [])
    avoid_topics = profile.get("avoided_topics", [])
    speech       = profile.get("speech_patterns", {})
    beefs        = profile.get("known_beefs", [])
    rel_text     = format_relationships(slug, profile, graph)

    beefs_text = ""
    if beefs:
        beefs_text = "\n".join(
            f"- {b.get('with','?')}: {b.get('description','')} [{b.get('status','?')}, {b.get('approximate_date','')}]"
            for b in beefs
        )

    prompt_request = f"""Write a system prompt for an AI twin of {name} ({fullname}) for a social media simulation platform called AstraLink Arena.

Personality data (from their documented public record):
- Core traits: {', '.join(traits)}
- Speech: energy={speech.get('energy_level','?')}, emoji={speech.get('emoji_usage','?')}, vocab={speech.get('vocabulary','?')}
- Recurring phrases: {', '.join(phrases)}
- Most discussed topics: {', '.join(top_topics)}
- Topics they avoid: {', '.join(avoid_topics)}

Documented opinions:
{json.dumps(opinions, indent=2)}

Relationships with other creators:
{rel_text}

Known beefs:
{beefs_text if beefs_text else 'None documented'}

The system prompt MUST:
1. Open with who they are, written in their own documented voice and energy
2. List their core documented positions on: money, success, competition, fame, business, social media
3. Define their relationship to each of the other 5 creators with specific emotional context
4. Include strict rules:
   - Never invent facts, quotes, or events not in their documented public record
   - If uncertain, briefly acknowledge it and stay in character
   - Stay in character at ALL times — do not break the fourth wall
   - Posts (tweets): max 280 characters — punchy, on-brand
   - Replies: max 500 characters — conversational but in character
   - React authentically to other creators based on documented relationships
5. Define speech patterns: vocabulary, energy, emoji use, punctuation style
6. Reference their actual catchphrases and verbal tics where documented

Write the system prompt in markdown. It should feel like instructions that will make an AI genuinely embody this person based purely on their public record.
"""

    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[{"role": "user", "content": prompt_request}],
        temperature=0.3,
        max_tokens=3000,
    )

    return response.choices[0].message.content.strip()


def run(slug: str) -> bool:
    PROMPT_DIR.mkdir(parents=True, exist_ok=True)
    out_file = PROMPT_DIR / f"{slug}_system.md"

    log.info(f"[{slug}] === Step 8: System prompt generation ===")

    groq_key = get_env("GROQ_API_KEY")
    client   = Groq(api_key=groq_key)

    profile = load_profile(slug)

    graph: dict = {}
    if GRAPH_FILE.exists():
        try:
            graph = load_json(GRAPH_FILE)
        except Exception:
            pass

    try:
        prompt_text = generate_system_prompt(slug, profile, graph, client)
        out_file.write_text(prompt_text, encoding="utf-8")
        log.info(f"[{slug}] System prompt saved → {out_file}")
        return True
    except Exception as exc:
        log.error(f"[{slug}] System prompt generation failed: {exc}")
        return False


if __name__ == "__main__":
    slug = sys.argv[1] if len(sys.argv) > 1 else "mrbeast"
    run(slug)
