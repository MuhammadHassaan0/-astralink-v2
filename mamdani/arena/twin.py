"""
arena/twin.py
Twin class — represents a single AI creator twin.

Each twin:
- Holds its slug, name, system prompt, profile, and relationships
- Retrieves relevant RAG context from its own Qdrant collection
- Generates tweet-length posts (≤280 chars) via Groq
- Generates replies (≤500 chars) to other twins' posts
"""

import logging
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

log = logging.getLogger("arena.twin")

GROQ_MODEL = "llama-3.3-70b-versatile"

# ── Voice profiles — one line per creator, drives the arena system prompt ──────
VOICE_PROFILES: dict[str, str] = {
    "mrbeast":    "Calm, systems thinker. Talks in scale and math. Never emotional.",
    "ishowspeed": "Chaotic but has a point. Runs sentences together. Raw.",
    "ksi":        "Confident, formal British, competitive. Direct claims.",
    "kaicenat":   "Community-first, short sentences, keeps it real.",
    "loganpaul":  "Self-aware, business-brained, evolved from his old self.",
    "jakepaul":   "Everything is a calculated play. Provocateur with a strategy.",
    "garyvee":    "No filter, conviction, lived-in truths. Slightly preachy but earns it.",
    "kaitrump":   "Composed, measured, aware of her position. Never reactive.",
}

# Canonical system prompt for content generation. Filled per-creator.
_ARENA_PROMPT_TEMPLATE = (
    "You are {name} in a live debate arena. Respond to the topic in your own voice.\n\n"
    "Rules:\n"
    "- Zero emojis. Not one.\n"
    "- No all-caps for emphasis.\n"
    "- Max 2-3 sentences. Short and punchy.\n"
    "- Take an actual side. No hedging.\n"
    "- Sound like a text they'd send, not a crafted tweet.\n\n"
    "Your voice: {profile}"
)


def build_system_prompt(slug: str, name: str) -> str:
    """Build the arena system prompt for a creator from their voice profile."""
    profile = VOICE_PROFILES.get(slug, "Authentic, direct, opinionated. Takes a clear side.")
    return _ARENA_PROMPT_TEMPLATE.format(name=name, profile=profile)

# Relationship descriptions for prompt context
_RELATIONSHIP_CONTEXT = {
    ("ksi", "loganpaul"):   "You and Logan Paul had a bitter boxing rivalry that turned into a genuine business partnership (Prime). It's competitive but now mutually profitable.",
    ("loganpaul", "ksi"):   "You and KSI had a bitter boxing rivalry that evolved into a real business partnership (Prime). Publicly friendly now, privately competitive.",
    ("jakepaul", "ksi"):    "You and KSI have ongoing mutual trash-talk. Competitive but both need the attention from it.",
    ("ksi", "jakepaul"):    "Jake Paul talks too much. He's not at your level but the beef gets views so you engage occasionally.",
    ("jakepaul", "loganpaul"): "Logan is your older brother and business partner. You respect him but compete constantly.",
    ("loganpaul", "jakepaul"): "Jake is your younger brother. You're proud of him but he's always trying to one-up you.",
    ("mrbeast", "kaicenat"): "You and Kai Cenat have collaborated. Mutually positive — you respect his streaming dominance.",
    ("kaicenat", "mrbeast"): "MrBeast is the biggest YouTuber ever. You've linked up. Genuine mutual respect.",
    ("ishowspeed", "kaicenat"): "You and Kai are close friends and hype each other constantly.",
    ("kaicenat", "ishowspeed"): "Speed is your guy. You two go crazy together. Genuine friendship.",
    ("kaitrump", "garyvee"):    "Gary Vee is a business figure you're aware of. You stay measured and don't get drawn in.",
    ("garyvee", "kaitrump"):    "Kai Trump is young and carries a famous name. You'd offer advice more than argue.",
}


@dataclass
class Twin:
    slug:         str
    name:         str
    system_prompt: str
    profile:      dict = field(default_factory=dict)
    relationships: dict = field(default_factory=dict)

    # injected at runtime
    _groq_client:  object = field(default=None, repr=False)
    _retrieve_fn:  object = field(default=None, repr=False)

    # ── Context retrieval ─────────────────────────────────────────────────────

    def _get_context(self, query: str, top_k: int = 5) -> tuple[str, list[dict]]:
        if self._retrieve_fn is None:
            return "", []
        try:
            chunks = self._retrieve_fn(query, self.slug)
            if not chunks:
                return "", []
            lines = []
            for c in chunks:
                src  = c.get("source_type", "")
                text = c.get("text", "").strip()[:300]
                date = c.get("publish_date", "")
                lines.append(f"[{src} {date}] {text}")
            return "\n---\n".join(lines), chunks
        except Exception as exc:
            log.warning("[%s] RAG retrieve failed: %s", self.slug, exc)
            return "", []

    # ── Post generation ───────────────────────────────────────────────────────

    def generate_post(self, topic: str, context: str = "", sentiment_context: str = "") -> str:
        """Generate a tweet-length post (≤280 chars) about a topic."""
        context_block = f"\nRelevant context from your documented record:\n{context}\n" if context else ""

        messages = [
            {"role": "system", "content": self.system_prompt},
            {
                "role": "user",
                "content": (
                    f"The topic: '{topic}'\n"
                    f"{context_block}"
                    + (f"Crowd context: {sentiment_context}\n" if sentiment_context else "")
                    + "Respond in character. Zero emojis. No all-caps. 2-3 sentences max. "
                    "Take a clear side. Sound like a text you'd actually send. "
                    "Do NOT start with your own name. Return ONLY the post text, nothing else."
                ),
            },
        ]

        try:
            resp = self._groq_client.chat.completions.create(
                model=GROQ_MODEL,
                messages=messages,
                temperature=0.85,
                max_tokens=100,
            )
            post = resp.choices[0].message.content.strip()
            # Hard-trim to 280
            if len(post) > 280:
                post = post[:277] + "..."
            return post
        except Exception as exc:
            log.error("[%s] generate_post failed: %s", self.slug, exc)
            return f"[{self.name} is currently offline]"

    # ── Reply generation ──────────────────────────────────────────────────────

    def generate_reply(self, post_content: str, author_slug: str, author_name: str) -> str:
        """Generate a reply (≤500 chars) to another twin's post."""
        rel_data = self.relationships.get(author_slug, {})
        rel_type = rel_data.get("relationship", "neutral")
        tension  = rel_data.get("tension_level", 2)

        # Pull relationship context from the hardcoded map as supplement
        rel_context = _RELATIONSHIP_CONTEXT.get((self.slug, author_slug), "")

        context_str, _ = self._get_context(post_content, top_k=3)
        context_block = f"\nRelevant context from your documented record:\n{context_str}\n" if context_str else ""

        rel_instruction = {
            "friendly":    f"You and {author_name} are friendly. Reply warmly but stay in your voice.",
            "positive":    f"You respect {author_name}. React positively but authentically.",
            "neutral":     f"You don't have strong feelings about {author_name} either way. React naturally.",
            "competitive": f"You're competitive with {author_name}. Don't be overtly hostile but assert yourself.",
            "negative":    f"You have tension with {author_name}. Stay cool but there's an edge to your reply.",
        }.get(rel_type, f"React to {author_name} authentically.")

        if rel_context:
            rel_instruction += f" Context: {rel_context}"

        messages = [
            {"role": "system", "content": self.system_prompt},
            {
                "role": "user",
                "content": (
                    f"{author_name} just posted: \"{post_content}\"\n\n"
                    f"{rel_instruction}\n"
                    f"{context_block}"
                    "Reply in character. Zero emojis. No all-caps. 2-3 sentences max. "
                    "Engage with what they actually said and take a position. "
                    "Do NOT start with your own name. Return ONLY the reply text, nothing else."
                ),
            },
        ]

        try:
            resp = self._groq_client.chat.completions.create(
                model=GROQ_MODEL,
                messages=messages,
                temperature=0.88,
                max_tokens=150,
            )
            reply = resp.choices[0].message.content.strip()
            if len(reply) > 500:
                reply = reply[:497] + "..."
            return reply
        except Exception as exc:
            log.error("[%s] generate_reply failed: %s", self.slug, exc)
            return f"[{self.name} is currently offline]"


# ── Factory ───────────────────────────────────────────────────────────────────

def load_twin(
    slug: str,
    groq_client,
    retrieve_fn,
    prompts_dir: Optional[Path] = None,
    profiles_dir: Optional[Path] = None,
    graph: Optional[dict] = None,
) -> Twin:
    """Instantiate a Twin, loading system prompt and profile from disk if available."""
    import json

    NAMES = {
        "mrbeast":    "MrBeast",
        "ishowspeed": "IShowSpeed",
        "kaicenat":   "Kai Cenat",
        "ksi":        "KSI",
        "loganpaul":  "Logan Paul",
        "jakepaul":   "Jake Paul",
        "garyvee":    "Gary Vaynerchuk",
        "kaitrump":   "Kai Trump",
    }
    name = NAMES.get(slug, slug)

    # System prompt is built from the canonical arena template + voice profile.
    # (prompts_dir is retained for backwards compatibility but no longer used.)
    system_prompt = build_system_prompt(slug, name)

    # Load profile
    profile: dict = {}
    if profiles_dir:
        profile_file = profiles_dir / slug / "profile.json"
        if profile_file.exists():
            try:
                profile = json.loads(profile_file.read_text(encoding="utf-8"))
                log.info("[%s] Loaded profile.json", slug)
            except Exception as exc:
                log.warning("[%s] Could not read profile.json: %s", slug, exc)

    # Load relationships from graph
    relationships: dict = {}
    if graph:
        relationships = graph.get(slug, {})

    twin = Twin(
        slug=slug,
        name=name,
        system_prompt=system_prompt,
        profile=profile,
        relationships=relationships,
    )
    twin._groq_client = groq_client
    twin._retrieve_fn = retrieve_fn
    return twin
