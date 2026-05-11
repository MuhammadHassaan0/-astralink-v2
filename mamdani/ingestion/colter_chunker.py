"""
ingestion/colter_chunker.py
Reads colter_scraped.json, chunks each document into 200-350 token pieces,
attaches metadata, and saves to raw_data/colter_chunks.json.
"""

import json
import re
import uuid
from datetime import date
from pathlib import Path

INPUT_FILE  = Path(__file__).parent / "raw_data" / "colter_scraped.json"
OUTPUT_FILE = Path(__file__).parent / "raw_data" / "colter_chunks.json"

TODAY = date.today().isoformat()

TOPIC_KEYWORDS = {
    "housing":       ["rent", "tenant", "landlord", "affordable", "eviction",
                      "apartment", "rso", "rent stabilization", "ellis act",
                      "just cause", "displacement", "anti-displacement",
                      "rent-stabilized", "sb79", "sb 79", "zoning", "upzoning",
                      "community land trust", "relocation"],
    "immigration":   ["undocumented", "ice", "immigrant", "sanctuary", "deportation",
                      "thai town", "little armenia", "legal defense",
                      "immigration status", "deport"],
    "homelessness":  ["homeless", "unhoused", "encampment", "shelter",
                      "housing first", "housing-first", "supportive housing"],
    "small_business":["small business", "permit", "red tape", "commercial rent",
                      "ombudsman", "restaurant", "bakery", "corridor",
                      "business owner", "permitting"],
    "government":    ["transparency", "accountability", "town hall", "constituent",
                      "council", "neighborhood council", "incumbent", "responsive",
                      "grassroots", "organizing", "community"],
}

STRIP_EXACT = {
    "skip to main content", "skip to navigation", "skip to content",
    "back to top", "share this page", "print this page",
    "cookie", "javascript", "enable javascript",
}

STRIP_CONTAINS = [
    "skip to main content", "skip to navigation", "back to top",
    "share this page", "print this page", "cookie policy",
    "accept cookies", "we use cookies", "javascript is required",
    "please enable javascript", "subscribe to our newsletter",
    "sign up for our newsletter", "follow us on", "donate now",
    "paid for by", "privacy policy", "terms of service",
    "all rights reserved",
]


def is_nav_link_line(line: str) -> bool:
    stripped = line.strip()
    is_md_link = bool(re.match(r'^[\*\-\+]?\s*\[.+?\]\(.+?\)\s*$', stripped))
    word_count = len(stripped.split())
    is_short_non_sentence = word_count < 8 and not stripped.endswith(('.', '!', '?', ':'))
    return is_md_link or (is_short_non_sentence and '[' in stripped and ']' in stripped)


def clean_markdown(raw_text: str) -> str:
    lines = raw_text.splitlines()
    cleaned: list[str] = []
    for line in lines:
        stripped = line.strip()
        lower    = stripped.lower()
        if not stripped:
            cleaned.append("")
            continue
        if lower in STRIP_EXACT:
            continue
        if any(phrase in lower for phrase in STRIP_CONTAINS):
            continue
        if is_nav_link_line(stripped):
            continue
        if re.match(r'^#{1,6}\s*$', stripped) or re.match(r'^[-_*]{3,}$', stripped):
            continue
        cleaned.append(line)
    result = re.sub(r'\n{3,}', '\n\n', '\n'.join(cleaned))
    return result.strip()


def estimate_tokens(text: str) -> int:
    return int(len(text.split()) * 0.75)


def infer_topic(text: str) -> str:
    t = text.lower()
    scores = {topic: sum(1 for kw in kws if kw in t)
              for topic, kws in TOPIC_KEYWORDS.items()}
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "general"


def is_quote(text: str) -> bool:
    matches = re.findall(r'["""][^"""]{20,}["""]', text)
    return len(matches) > 0


def is_recent(text: str) -> bool:
    return "2026" in text or "2025" in text


def priority_score(text: str, source_type: str) -> int:
    if is_quote(text):
        return 3
    if source_type in ("campaign_site", "voter_guide", "candidate_profile") or any(
        kw in text.lower() for kw in ["will", "plan", "propose", "commit",
                                       "implement", "launch", "announce", "fight for"]
    ):
        return 2
    return 1


def split_sentences(text: str) -> list[str]:
    parts = re.split(r'(?<=[.!?])\s+', text.strip())
    return [p.strip() for p in parts if p.strip()]


def split_paragraphs(text: str) -> list[str]:
    paras = re.split(r'\n{2,}', text.strip())
    return [p.strip() for p in paras if p.strip()]


def chunk_document(raw_text: str, target_min: int = 150, target_max: int = 250) -> list[str]:
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
        if buffer_words + para_words <= target_max:
            buffer.append(para)
            buffer_words += para_words
            if buffer_words >= target_min:
                flush()
        elif para_words <= target_max:
            flush()
            buffer.append(para)
            buffer_words = para_words
            if buffer_words >= target_min:
                flush()
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
                if sent_words < target_min // 2 and chunks:
                    chunks[-1] += " " + remainder
                else:
                    chunks.append(remainder)

    flush()
    return [c for c in chunks if len(c.split()) >= 20]


def build_chunks(doc: dict) -> list[dict]:
    url         = doc["url"]
    source_type = doc.get("source_type", "general")
    raw_text    = doc.get("raw_text", "")
    title       = doc.get("title", "")

    if not raw_text or len(raw_text.split()) < 20:
        return []

    raw_text = clean_markdown(raw_text)
    if len(raw_text.split()) < 20:
        return []

    doc_id      = re.sub(r'[^a-z0-9]', '_', url.lower())[:80]
    text_chunks = chunk_document(raw_text)
    result = []

    for chunk_text in text_chunks:
        result.append({
            "chunk_id":       str(uuid.uuid4()),
            "doc_id":         doc_id,
            "source_type":    source_type,
            "source_url":     url,
            "title":          title,
            "published_at":   TODAY,
            "speaker":        "Colter",
            "topic":          infer_topic(chunk_text),
            "is_quote":       is_quote(chunk_text),
            "is_recent":      is_recent(chunk_text),
            "priority_score": priority_score(chunk_text, source_type),
            "text":           chunk_text,
            "word_count":     len(chunk_text.split()),
            "token_estimate": estimate_tokens(chunk_text),
        })

    return result


def main():
    print("=== Colter Chunker ===")

    docs = json.loads(INPUT_FILE.read_text())
    print(f"  Loaded {len(docs)} documents from colter_scraped.json\n")

    all_chunks: list[dict] = []
    for doc in docs:
        chunks = build_chunks(doc)
        print(f"  {len(chunks):>4} chunks  ←  {doc['url']}")
        all_chunks.extend(chunks)

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.write_text(json.dumps(all_chunks, indent=2, ensure_ascii=False))

    total      = len(all_chunks)
    avg_words  = sum(c["word_count"] for c in all_chunks) / total if total else 0
    n_quote    = sum(1 for c in all_chunks if c["is_quote"])
    by_topic   = {}
    for c in all_chunks:
        by_topic[c["topic"]] = by_topic.get(c["topic"], 0) + 1

    print(f"\n── Summary ───────────────────────────────────────────")
    print(f"  Total chunks:    {total}")
    print(f"  Avg words/chunk: {avg_words:.0f}")
    print(f"  is_quote=true:   {n_quote}")
    print(f"\n  By topic:")
    for topic, count in sorted(by_topic.items(), key=lambda x: -x[1]):
        print(f"    {topic:<18} {count}")
    print(f"\n  Output: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
