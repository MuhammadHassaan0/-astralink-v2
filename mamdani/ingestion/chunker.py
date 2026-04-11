"""
ingestion/chunker.py
Reads scraped.json, chunks each document into 200-350 token pieces,
attaches metadata, and saves to raw_data/chunks.json.
"""

import json
import re
import uuid
from datetime import date
from pathlib import Path

INPUT_FILE  = Path(__file__).parent / "raw_data" / "scraped.json"
OUTPUT_FILE = Path(__file__).parent / "raw_data" / "chunks.json"

TODAY = date.today().isoformat()

# ── Topic keywords ────────────────────────────────────────────────────────────
TOPIC_KEYWORDS = {
    "housing":      ["housing", "rent", "tenant", "landlord", "affordable", "eviction",
                     "apartment", "home", "shelter", "homeless"],
    "safety":       ["safety", "police", "crime", "nypd", "gun", "violence", "shooting",
                     "arrest", "jail", "prison", "public safety"],
    "immigration":  ["immigra", "undocumented", "migrant", "asylum", "ice ", "deporta",
                     "border", "refugee", "visa", "citizenship"],
    "childcare":    ["childcare", "child care", "daycare", "preschool", "pre-k", "children",
                     "family", "parent", "school", "education"],
    "transport":    ["transit", "subway", "bus", "mta", "fare", "commut", "transport",
                     "congestion", "bike", "pedestrian", "street"],
}


# ── Boilerplate patterns to strip ────────────────────────────────────────────

STRIP_EXACT = {
    "skip to main content",
    "skip to navigation",
    "skip to content",
    "back to top",
    "share this page",
    "print this page",
    "cookie",
    "javascript",
    "enable javascript",
    "this site requires javascript",
}

STRIP_CONTAINS = [
    "skip to main content",
    "skip to navigation",
    "back to top",
    "share this page",
    "print this page",
    "cookie policy",
    "accept cookies",
    "we use cookies",
    "javascript is required",
    "please enable javascript",
    "official website",
    "how you know",
    "official websites use .gov",
    ".gov website belongs to",
    "lock (🔒)",
    "https:// means",
    "secure .gov websites use https",
    "sign in to add to my list",
    "show lessread more",
    "show more replies",
    "hide replies",
    "free with ads",
    "video has closed captions",
    "(end video clip)",
]


def is_nav_link_line(line: str) -> bool:
    """True if line looks like a bare nav link — short markdown link, few words."""
    stripped = line.strip()
    # Markdown link pattern like: * [Label](url) or [Label](url)
    is_md_link = bool(re.match(r'^[\*\-\+]?\s*\[.+?\]\(.+?\)\s*$', stripped))
    word_count = len(stripped.split())
    # Short lines with no sentence structure are likely nav items
    is_short_non_sentence = word_count < 8 and not stripped.endswith(('.', '!', '?', ':'))
    return is_md_link or (is_short_non_sentence and '[' in stripped and ']' in stripped)


def clean_markdown(raw_text: str) -> str:
    """
    Strip boilerplate lines from scraped markdown before chunking.
    Removes: nav items, cookie notices, JS warnings, gov site banners,
    short bare links, and other structural noise.
    """
    lines = raw_text.splitlines()
    cleaned: list[str] = []

    for line in lines:
        stripped = line.strip()
        lower    = stripped.lower()

        # Drop empty lines (kept later via paragraph splitting)
        if not stripped:
            cleaned.append("")
            continue

        # Drop exact boilerplate matches
        if lower in STRIP_EXACT:
            continue

        # Drop lines containing known boilerplate phrases
        if any(phrase in lower for phrase in STRIP_CONTAINS):
            continue

        # Drop bare nav link lines
        if is_nav_link_line(stripped):
            continue

        # Drop markdown images/icons and table boilerplate
        if stripped.startswith("![") or stripped.startswith("|"):
            continue

        # Drop mostly-symbol lines (common in noisy transcript dumps)
        alpha_chars = sum(ch.isalpha() for ch in stripped)
        if alpha_chars < 3:
            continue

        # Drop "UI-only" short lines from video/comment pages
        if len(stripped.split()) <= 5 and any(tok in lower for tok in ("reply", "like", "dislike", "share", "search")):
            continue

        # Drop lines that are pure markdown horizontal rules or headers with no text
        if re.match(r'^#{1,6}\s*$', stripped) or re.match(r'^[-_*]{3,}$', stripped):
            continue

        cleaned.append(line)

    # Collapse 3+ consecutive blank lines into 2
    result = re.sub(r'\n{3,}', '\n\n', '\n'.join(cleaned))
    return result.strip()


def estimate_tokens(text: str) -> int:
    """Rough token estimate: ~0.75 tokens per word."""
    return int(len(text.split()) * 0.75)


def infer_topic(text: str) -> str:
    t = text.lower()
    scores = {topic: sum(1 for kw in kws if kw in t)
              for topic, kws in TOPIC_KEYWORDS.items()}
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "general"


def is_quote(text: str) -> bool:
    # True if chunk has a quoted phrase of at least 5 words
    matches = re.findall(r'["\u201c\u201d][^"\u201c\u201d]{20,}["\u201c\u201d]', text)
    return len(matches) > 0


def is_recent(text: str) -> bool:
    return "2026" in text


def priority_score(text: str, source_type: str) -> int:
    if is_quote(text):
        return 3
    if source_type in ("policy", "news") or any(
        kw in text.lower() for kw in ["will", "plan", "propose", "commit",
                                       "implement", "launch", "announce", "sign"]
    ):
        return 2
    return 1


def split_sentences(text: str) -> list[str]:
    """Split text into sentences, preserving the delimiter."""
    parts = re.split(r'(?<=[.!?])\s+', text.strip())
    return [p.strip() for p in parts if p.strip()]


def split_paragraphs(text: str) -> list[str]:
    """Split on double newlines (markdown paragraphs)."""
    paras = re.split(r'\n{2,}', text.strip())
    return [p.strip() for p in paras if p.strip()]


def chunk_document(raw_text: str,
                   target_min: int = 90,
                   target_max: int = 160) -> list[str]:
    """
    Chunk raw_text into pieces of target_min–target_max words.
    Split at paragraph boundaries first, then sentence boundaries.
    Never split mid-sentence.
    """
    paragraphs = split_paragraphs(raw_text)
    chunks: list[str] = []
    buffer: list[str] = []
    buffer_words = 0

    def flush():
        nonlocal buffer, buffer_words
        if buffer:
            chunks.append(" ".join(buffer))
            buffer = []
            buffer_words = 0

    for para in paragraphs:
        para_words = len(para.split())

        # Paragraph fits entirely in remaining buffer space
        if buffer_words + para_words <= target_max:
            buffer.append(para)
            buffer_words += para_words
            # Flush if we've hit the minimum
            if buffer_words >= target_min:
                flush()

        # Paragraph alone is within range — flush current, start fresh
        elif para_words <= target_max:
            flush()
            buffer.append(para)
            buffer_words = para_words
            if buffer_words >= target_min:
                flush()

        # Paragraph is too large — split by sentence
        else:
            flush()
            sentences = split_sentences(para)
            sent_buf: list[str] = []
            sent_words = 0
            for sent in sentences:
                sw = len(sent.split())
                if sent_words + sw > target_max and sent_words >= target_min:
                    chunks.append(" ".join(sent_buf))
                    sent_buf = [sent]
                    sent_words = sw
                else:
                    sent_buf.append(sent)
                    sent_words += sw
            if sent_buf:
                remainder = " ".join(sent_buf)
                # Merge tiny remainders with previous chunk
                if sent_words < target_min // 2 and chunks:
                    chunks[-1] += " " + remainder
                else:
                    chunks.append(remainder)

    flush()  # anything left in buffer

    return [c for c in chunks if len(c.split()) >= 20]  # drop tiny fragments


def noise_score(text: str) -> float:
    """
    Estimate how noisy a chunk is.
    Higher score = more likely UI/nav/comment garbage.
    """
    words = text.split()
    if not words:
        return 1.0

    lowered = text.lower()
    alpha = sum(ch.isalpha() for ch in text)
    total = max(len(text), 1)
    non_alpha_ratio = 1 - (alpha / total)

    ui_hits = sum(
        1 for p in (
            "reply", "like", "dislike", "show more", "show less", "sign in",
            "cookie", "all rights reserved", "nyc is a trademark",
        ) if p in lowered
    )
    short_lines = [ln for ln in text.splitlines() if ln.strip() and len(ln.split()) <= 4]
    short_line_ratio = len(short_lines) / max(len(text.splitlines()), 1)

    return (non_alpha_ratio * 0.9) + (ui_hits * 0.2) + (short_line_ratio * 0.8)


def is_low_signal_chunk(chunk_text: str, source_url: str) -> bool:
    # Very noisy text should be dropped.
    if noise_score(chunk_text) >= 0.95:
        return True

    # Chunks with too few sentences are often broad nav dumps.
    sentence_count = len(split_sentences(chunk_text))
    if len(chunk_text.split()) > 70 and sentence_count < 2:
        return True

    return False


def build_chunks(doc: dict) -> list[dict]:
    url         = doc["url"]
    source_type = doc.get("source_type", "general")
    raw_text    = doc.get("raw_text", "")
    title       = doc.get("title", "")

    if not raw_text or len(raw_text.split()) < 20:
        return []

    raw_text    = clean_markdown(raw_text)  # strip boilerplate before chunking

    if len(raw_text.split()) < 20:
        return []

    doc_id      = re.sub(r'[^a-z0-9]', '_', url.lower())[:80]
    text_chunks = chunk_document(raw_text)
    result = []
    seen = set()

    for chunk_text in text_chunks:
        if is_low_signal_chunk(chunk_text, url):
            continue

        normalized = re.sub(r"\s+", " ", chunk_text).strip().lower()
        if normalized in seen:
            continue
        seen.add(normalized)

        result.append({
            "chunk_id":      str(uuid.uuid4()),
            "doc_id":        doc_id,
            "source_type":   source_type,
            "source_url":    url,
            "title":         title,
            "published_at":  TODAY,
            "speaker":       "Mamdani",
            "topic":         infer_topic(chunk_text),
            "is_quote":      is_quote(chunk_text),
            "is_recent":     is_recent(chunk_text),
            "priority_score": priority_score(chunk_text, source_type),
            "text":          chunk_text,
            "word_count":    len(chunk_text.split()),
            "token_estimate": estimate_tokens(chunk_text),
        })

    return result


def main():
    print("=== Mamdani Chunker ===")

    docs = json.loads(INPUT_FILE.read_text())
    print(f"  Loaded {len(docs)} documents from scraped.json\n")

    all_chunks: list[dict] = []
    for doc in docs:
        chunks = build_chunks(doc)
        print(f"  {len(chunks):>4} chunks  ←  {doc['url']}")
        all_chunks.extend(chunks)

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.write_text(json.dumps(all_chunks, indent=2, ensure_ascii=False))

    # Stats
    total        = len(all_chunks)
    avg_words    = sum(c["word_count"] for c in all_chunks) / total if total else 0
    avg_tokens   = sum(c["token_estimate"] for c in all_chunks) / total if total else 0
    n_quote      = sum(1 for c in all_chunks if c["is_quote"])
    n_recent     = sum(1 for c in all_chunks if c["is_recent"])
    by_topic     = {}
    for c in all_chunks:
        by_topic[c["topic"]] = by_topic.get(c["topic"], 0) + 1
    by_priority  = {1: 0, 2: 0, 3: 0}
    for c in all_chunks:
        by_priority[c["priority_score"]] += 1

    print(f"\n── Summary ──────────────────────────")
    print(f"  Total chunks:        {total}")
    print(f"  Avg words/chunk:     {avg_words:.0f}")
    print(f"  Avg tokens/chunk:    {avg_tokens:.0f}")
    print(f"  is_quote=true:       {n_quote}  ({n_quote/total*100:.1f}%)" if total else "")
    print(f"  is_recent=true:      {n_recent}  ({n_recent/total*100:.1f}%)" if total else "")
    print(f"\n  By topic:")
    for topic, count in sorted(by_topic.items(), key=lambda x: -x[1]):
        print(f"    {topic:<14} {count}")
    print(f"\n  By priority:")
    for p in [3, 2, 1]:
        label = {3: "direct quote", 2: "policy stmt", 1: "general"}[p]
        print(f"    P{p} {label:<14} {by_priority[p]}")
    print(f"\n  Output saved to: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
