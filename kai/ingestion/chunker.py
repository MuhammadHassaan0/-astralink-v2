"""
kai/ingestion/chunker.py
Chunk scraped Kai Trump markdown into RAG-ready pieces.

Usage:
    python3.12 ingestion/chunker.py
"""

import json
import re
import uuid
from datetime import date
from pathlib import Path

ROOT        = Path(__file__).parent.parent
IN_FILE     = ROOT / "ingestion" / "raw_data" / "scraped.json"
OUT_FILE    = ROOT / "ingestion" / "raw_data" / "chunks.json"

TARGET_MIN  = 150   # words
TARGET_MAX  = 250   # words


# ── Cleaning ──────────────────────────────────────────────────────────────────

NAV_PATTERNS = [
    r"^\s*\[Skip to",
    r"^\s*\*\s*\[.*?\]\(#",          # anchor nav links
    r"Cookie",
    r"JavaScript",
    r"enable JavaScript",
    r"^\s*\|\s*$",                    # table separator lines
    r"^\s*\*\s*Languages?\s*$",
    r"^\s*\*\s*Contents\s*$",
    r"^\s*\*\s*\(Top\)\s*$",
]
NAV_RE = [re.compile(p, re.IGNORECASE) for p in NAV_PATTERNS]


def is_nav_link_line(line: str) -> bool:
    """True if line is purely markdown nav/link clutter."""
    stripped = line.strip()
    if not stripped:
        return False
    # Line is mostly markdown links with no real prose
    text_only = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", stripped)
    text_only = re.sub(r"[#*>\-|`]", "", text_only).strip()
    if len(text_only) < 15 and re.search(r"\]\(", stripped):
        return True
    return False


def clean_markdown(md: str) -> str:
    lines   = md.splitlines()
    cleaned = []
    for line in lines:
        if any(p.search(line) for p in NAV_RE):
            continue
        if is_nav_link_line(line):
            continue
        cleaned.append(line)
    text = "\n".join(cleaned)
    # Collapse 3+ blank lines → 2
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


# ── Topic inference ───────────────────────────────────────────────────────────

TOPIC_KEYWORDS = {
    "golf":      ["golf", "golfer", "swing", "tournament", "club", "course", "birdie", "par"],
    "family":    ["trump", "father", "dad", "family", "grandfather", "ivanka", "barron", "melania"],
    "social":    ["instagram", "tiktok", "social media", "post", "followers", "viral"],
    "school":    ["school", "student", "graduate", "university", "college", "education"],
    "fashion":   ["fashion", "style", "outfit", "wear", "dress", "clothes"],
    "politics":  ["republican", "election", "campaign", "white house", "president", "political"],
}

def infer_topic(text: str) -> str:
    low = text.lower()
    for topic, keywords in TOPIC_KEYWORDS.items():
        if any(kw in low for kw in keywords):
            return topic
    return "general"


# ── Chunking ──────────────────────────────────────────────────────────────────

def split_into_paragraphs(text: str) -> list[str]:
    return [p.strip() for p in re.split(r"\n\n+", text) if p.strip()]


def word_count(text: str) -> int:
    return len(text.split())


def chunk_document(doc: dict) -> list[dict]:
    md       = clean_markdown(doc.get("markdown", ""))
    url      = doc.get("url", "")
    title    = doc.get("title", "")
    src_type = doc.get("source_type", "general")
    doc_id   = str(uuid.uuid4())
    today    = date.today().isoformat()

    paragraphs = split_into_paragraphs(md)
    chunks     = []
    buffer     = []
    buf_words  = 0

    def flush(buf: list[str]) -> None:
        if not buf:
            return
        text     = "\n\n".join(buf).strip()
        wc       = word_count(text)
        if wc < 30:
            return
        topic    = infer_topic(text)
        is_quote = bool(re.search(r'["""]', text))
        is_recent = "2024" in text or "2025" in text or "2026" in text

        # Priority: direct quote = 3, family/politics = 2, general = 1
        if is_quote:
            priority = 3
        elif topic in ("family", "politics", "golf"):
            priority = 2
        else:
            priority = 1

        chunks.append({
            "chunk_id":      str(uuid.uuid4()),
            "doc_id":        doc_id,
            "source_type":   src_type,
            "source_url":    url,
            "title":         title,
            "published_at":  today,
            "speaker":       "Kai",
            "topic":         topic,
            "is_quote":      is_quote,
            "is_recent":     is_recent,
            "priority_score": priority,
            "word_count":    wc,
            "text":          text,
        })

    for para in paragraphs:
        pw = word_count(para)

        # Single paragraph already too large — split by sentence
        if pw > TARGET_MAX:
            sentences = re.split(r"(?<=[.!?])\s+", para)
            for sent in sentences:
                sw = word_count(sent)
                if buf_words + sw > TARGET_MAX and buf_words >= TARGET_MIN:
                    flush(buffer)
                    buffer, buf_words = [], 0
                buffer.append(sent)
                buf_words += sw
            continue

        if buf_words + pw > TARGET_MAX and buf_words >= TARGET_MIN:
            flush(buffer)
            buffer, buf_words = [], 0

        buffer.append(para)
        buf_words += pw

    flush(buffer)
    return chunks


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("=== Kai Chunker ===\n")
    docs = json.loads(IN_FILE.read_text())
    print(f"  Loaded {len(docs)} scraped pages")

    all_chunks = []
    for doc in docs:
        doc_chunks = chunk_document(doc)
        print(f"  {doc['url'][:70]:<70} → {len(doc_chunks)} chunks")
        all_chunks.extend(doc_chunks)

    OUT_FILE.write_text(json.dumps(all_chunks, indent=2, ensure_ascii=False))
    print(f"\n  Total chunks: {len(all_chunks)}")
    print(f"  Saved → {OUT_FILE}")


if __name__ == "__main__":
    main()
