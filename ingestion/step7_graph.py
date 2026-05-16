"""
ingestion/step7_graph.py
Build a cross-personality relationship graph from all six profile.json files.

Output → /data/relationship_graph.json

Graph format:
{
  "mrbeast": {
    "ksi": {"relationship": "friendly", "evidence": "...", "tension_level": 1},
    ...
  },
  ...
}
tension_level: 1 = no tension, 5 = high tension/active beef
"""

import json
from pathlib import Path

from groq import Groq

from .config import DATA_DIR, SLUG_LIST, GROQ_MODEL
from .utils import get_env, get_logger, load_json, save_json

log = get_logger("step7")

GRAPH_FILE = DATA_DIR / "relationship_graph.json"

SENTIMENT_TO_TENSION = {
    "friendly":    1,
    "positive":    1,
    "neutral":     2,
    "competitive": 3,
    "negative":    4,
    "beef":        5,
}


def build_graph_from_profiles() -> dict:
    """
    Aggregate relationship data directly from each personality's profile.json.
    Also uses Groq to cross-validate and fill gaps.
    """
    # Load all profiles
    profiles: dict[str, dict] = {}
    for slug in SLUG_LIST:
        pf = DATA_DIR / slug / "profile.json"
        if pf.exists():
            try:
                profiles[slug] = load_json(pf)
            except Exception as exc:
                log.warning(f"Could not load {slug}/profile.json: {exc}")

    if not profiles:
        log.error("No profiles found — run step 6 first")
        return {}

    # Build initial graph from profiles
    graph: dict[str, dict] = {slug: {} for slug in SLUG_LIST}

    for slug, profile in profiles.items():
        relationships = profile.get("relationships", {})
        for other_slug in SLUG_LIST:
            if other_slug == slug:
                continue
            rel_data = relationships.get(other_slug, {})
            sentiment = rel_data.get("sentiment", "neutral")
            tension   = SENTIMENT_TO_TENSION.get(sentiment, 2)
            graph[slug][other_slug] = {
                "relationship":  sentiment,
                "evidence":      rel_data.get("evidence", "undocumented"),
                "detail":        rel_data.get("detail", ""),
                "tension_level": tension,
            }

    return graph


def enrich_with_groq(graph: dict, profiles: dict) -> dict:
    """
    Use Groq to cross-check symmetry and fill any gaps in the relationship graph.
    """
    groq_key = get_env("GROQ_API_KEY")
    client   = Groq(api_key=groq_key)

    # Build a summary of all known beefs and cross-creator events
    beefs_summary = []
    for slug, profile in profiles.items():
        for beef in profile.get("known_beefs", []):
            beefs_summary.append(
                f"{profile.get('name', slug)} vs {beef.get('with','?')}: "
                f"{beef.get('description','')} [{beef.get('approximate_date','')}]"
            )

    prompt = f"""You are building a relationship graph for these 6 internet creators:
MrBeast (mrbeast), IShowSpeed (ishowspeed), Kai Cenat (kaicenat),
KSI (ksi), Logan Paul (loganpaul), Jake Paul (jakepaul).

Known documented interactions and beefs:
{chr(10).join(beefs_summary) if beefs_summary else 'None documented in corpus'}

Current graph (from profile extraction):
{json.dumps(graph, indent=2)}

Your task: Review the graph for consistency and accuracy.
- If A says "friendly" to B but B says "negative" to A, use documented evidence to resolve
- tension_level: 1=no tension, 2=neutral, 3=competitive, 4=negative/cold, 5=active beef
- relationship values: friendly, positive, neutral, competitive, negative
- Evidence must cite real documented events (collabs, tweets, fights, public statements)
- If undocumented, use "neutral" with tension_level 2

Return ONLY the corrected graph as valid JSON (same structure, no markdown).
"""

    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=4096,
        )
        raw = response.choices[0].message.content.strip()
        if raw.startswith("```"):
            raw = raw.split("```", 2)[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.rsplit("```", 1)[0]
        enriched = json.loads(raw.strip())
        log.info("Groq cross-validation complete")
        return enriched
    except Exception as exc:
        log.warning(f"Groq enrichment failed ({exc}) — using raw profile graph")
        return graph


def run() -> bool:
    log.info("=== Step 7: Building relationship graph ===")

    profiles: dict[str, dict] = {}
    for slug in SLUG_LIST:
        pf = DATA_DIR / slug / "profile.json"
        if pf.exists():
            try:
                profiles[slug] = load_json(pf)
            except Exception:
                pass

    missing = [s for s in SLUG_LIST if s not in profiles]
    if missing:
        log.warning(f"Missing profiles for: {missing} — graph may be incomplete")

    graph = build_graph_from_profiles()

    if len(profiles) >= 2:
        graph = enrich_with_groq(graph, profiles)

    save_json(GRAPH_FILE, graph)
    log.info(f"Relationship graph saved → {GRAPH_FILE}")

    # Print summary
    log.info("=== Relationship Summary ===")
    for slug in SLUG_LIST:
        for other in SLUG_LIST:
            if other == slug:
                continue
            rel  = graph.get(slug, {}).get(other, {})
            rel_type = rel.get("relationship", "?")
            tension  = rel.get("tension_level", "?")
            log.info(f"  {slug:12s} → {other:12s}: {rel_type} (tension={tension})")

    return True


if __name__ == "__main__":
    run()
