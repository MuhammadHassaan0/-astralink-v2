"""
retrieval/retriever.py
Hybrid retrieval over the Qdrant 'mamdani' collection using:
  - Dense vector search (FastEmbed BAAI/bge-small-en-v1.5)
  - BM25 sparse vector search
  - Reciprocal Rank Fusion (RRF, k=60) for result fusion
  - Query-type classification for metadata boosting
"""

import math
import os
import re
import sys
from pathlib import Path
from typing import Literal

from dotenv import load_dotenv
from fastembed import TextEmbedding
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Filter,
    FieldCondition,
    MatchValue,
    SparseVector,
    NearestQuery,
    QueryRequest,
)

load_dotenv(Path(__file__).parent.parent / ".env")

QDRANT_URL      = os.getenv("QDRANT_URL", "http://localhost:6333")
QDRANT_API_KEY  = os.getenv("QDRANT_API_KEY", None)
COLLECTION_NAME = "mamdani"
DENSE_MODEL     = "BAAI/bge-small-en-v1.5"
TOP_K_SEARCH    = 20
TOP_K_RETURN    = 8
RRF_K           = 60

QueryType = Literal["recent_event", "policy_issue", "persona_general", "smalltalk", "general"]

# ── Singleton embedder (loaded once) ─────────────────────────────────────────
_embedder: TextEmbedding | None = None

def get_embedder() -> TextEmbedding:
    global _embedder
    if _embedder is None:
        _embedder = TextEmbedding(model_name=DENSE_MODEL)
    return _embedder


# ── Tokeniser (must match embedder.py) ───────────────────────────────────────

def tokenise(text: str) -> list[str]:
    return re.findall(r"[a-z0-9']+", text.lower())


# ── BM25 sparse query vector (TF * IDF approximation) ────────────────────────
# We load the vocab/idf from the chunks at query time by re-deriving them.
# For a production system these would be persisted; for this project the
# corpus is small enough to recompute cheaply.

_vocab: dict[str, int] | None = None
_idf:   dict[str, float] | None = None

def _load_vocab_idf():
    global _vocab, _idf
    if _vocab is not None:
        return
    chunks_file = Path(__file__).parent.parent / "ingestion" / "raw_data" / "chunks.json"
    import json
    chunks = json.loads(chunks_file.read_text())
    texts  = [c["text"] for c in chunks]
    N      = len(texts)

    _vocab = {}
    df: dict[str, int] = {}
    for text in texts:
        toks = set(tokenise(text))
        for tok in toks:
            if tok not in _vocab:
                _vocab[tok] = len(_vocab)
            df[tok] = df.get(tok, 0) + 1

    _idf = {tok: math.log((N - freq + 0.5) / (freq + 0.5) + 1)
            for tok, freq in df.items()}


def build_sparse_query_vector(query: str,
                               k1: float = 1.5) -> tuple[list[int], list[float]]:
    """Build a BM25-style sparse vector for a query (TF = 1 per unique term)."""
    _load_vocab_idf()
    tokens  = tokenise(query)
    indices, values = [], []
    seen = set()
    for tok in tokens:
        if tok in _vocab and tok in _idf and tok not in seen:
            tf_score = (1 * (k1 + 1)) / (1 + k1)   # TF=1 for query terms
            score    = tf_score * _idf[tok]
            if score > 0:
                indices.append(_vocab[tok])
                values.append(float(score))
            seen.add(tok)
    return indices, values


# ── Query classification ──────────────────────────────────────────────────────

QUERY_PATTERNS: dict[QueryType, list[str]] = {
    "recent_event":   ["latest", "today", "recent", "this week", "2026",
                       "announced", "new", "just", "now", "update"],
    "policy_issue":   ["housing", "rent", "childcare", "transport", "safety",
                       "immigration", "budget", "plan", "policy", "platform",
                       "affordable", "transit", "subway", "crime"],
    "persona_general": ["who", "believe", "think", "feel", "values", "why",
                        "stand for", "care about", "vision", "philosophy"],
    "smalltalk":      ["hello", "hi", "how are you", "hey", "good morning",
                       "good evening", "what's up"],
}

def classify_query(query: str) -> QueryType:
    q = query.lower()
    for qtype, keywords in QUERY_PATTERNS.items():
        if any(kw in q for kw in keywords):
            return qtype
    return "general"


# ── Metadata filter builder ───────────────────────────────────────────────────

TOPIC_MAP = {
    "housing":     ["housing", "rent", "affordable"],
    "safety":      ["safety", "crime", "police"],
    "immigration": ["immigration", "undocumented", "migrant"],
    "childcare":   ["childcare", "child care", "preschool", "education"],
    "transport":   ["transit", "subway", "mta", "transport"],
}

def infer_topic_from_query(query: str) -> str | None:
    q = query.lower()
    for topic, keywords in TOPIC_MAP.items():
        if any(kw in q for kw in keywords):
            return topic
    return None


def build_filter(query_type: QueryType, query: str) -> Filter | None:
    if query_type == "recent_event":
        return Filter(must=[FieldCondition(key="is_recent", match=MatchValue(value=True))])
    if query_type == "policy_issue":
        topic = infer_topic_from_query(query)
        if topic:
            return Filter(must=[FieldCondition(key="topic", match=MatchValue(value=topic))])
    if query_type == "persona_general":
        return Filter(must=[
            FieldCondition(key="is_quote",       match=MatchValue(value=True)),
            FieldCondition(key="priority_score", match=MatchValue(value=3)),
        ])
    return None


# ── RRF fusion ────────────────────────────────────────────────────────────────

def reciprocal_rank_fusion(
    ranked_lists: list[list[str]],
    k: int = RRF_K,
) -> list[tuple[str, float]]:
    """
    Fuse multiple ranked lists of chunk IDs using RRF.
    Returns list of (chunk_id, rrf_score) sorted descending.
    """
    scores: dict[str, float] = {}
    for ranked in ranked_lists:
        for rank, chunk_id in enumerate(ranked):
            scores[chunk_id] = scores.get(chunk_id, 0.0) + 1.0 / (k + rank + 1)
    return sorted(scores.items(), key=lambda x: -x[1])


# ── Main hybrid retrieval ─────────────────────────────────────────────────────

def retrieve(
    query: str,
    top_k: int = TOP_K_RETURN,
    verbose: bool = False,
) -> list[dict]:
    """
    Hybrid retrieve: dense + BM25 sparse → RRF → top_k chunks.
    Returns list of chunk payload dicts, each with an added 'rrf_score'.
    """
    client     = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
    embedder   = get_embedder()

    query_type = classify_query(query)
    f          = build_filter(query_type, query)

    if verbose:
        print(f"  Query type: {query_type}")
        print(f"  Filter:     {f}")

    # ── Dense query vector
    dense_vec = list(embedder.embed([query]))[0].tolist()

    # ── Sparse query vector
    sp_idx, sp_val = build_sparse_query_vector(query)

    # ── Qdrant batch search (dense + sparse in one round trip)
    results = client.query_batch_points(
        collection_name=COLLECTION_NAME,
        requests=[
            QueryRequest(
                query=NearestQuery(nearest=dense_vec),
                using="dense",
                filter=f,
                limit=TOP_K_SEARCH,
                with_payload=True,
            ),
            QueryRequest(
                query=NearestQuery(nearest=SparseVector(indices=sp_idx, values=sp_val)),
                using="sparse",
                filter=f,
                limit=TOP_K_SEARCH,
                with_payload=True,
            ),
        ],
    )

    dense_results, sparse_results = results[0].points, results[1].points

    # ── Build id → payload map
    payload_map: dict[str, dict] = {}
    for hit in dense_results + sparse_results:
        pid = str(hit.id)
        if pid not in payload_map:
            payload_map[pid] = hit.payload

    # ── RRF
    dense_ranking  = [str(h.id) for h in dense_results]
    sparse_ranking = [str(h.id) for h in sparse_results]
    fused          = reciprocal_rank_fusion([dense_ranking, sparse_ranking])

    # ── Return top_k with rrf_score attached
    top = []
    for chunk_id, rrf_score in fused[:top_k]:
        payload = payload_map.get(chunk_id, {})
        top.append({**payload, "rrf_score": round(rrf_score, 6), "_id": chunk_id})
    return top


# ── Test harness ──────────────────────────────────────────────────────────────

TEST_QUERIES = [
    "What is your housing policy?",
    "What did you announce recently?",
    "What do you believe in?",
]

def run_tests():
    print("=" * 60)
    print("  Mamdani Retriever — Test Run")
    print("=" * 60)

    for query in TEST_QUERIES:
        print(f"\n Query: \"{query}\"")
        print(f" {'─' * 56}")
        results = retrieve(query, top_k=3, verbose=True)
        for i, r in enumerate(results, 1):
            print(f"\n  [{i}] score={r['rrf_score']}  topic={r.get('topic')}  "
                  f"is_quote={r.get('is_quote')}  priority={r.get('priority_score')}")
            print(f"      source: {r.get('source_url')}")
            snippet = r.get("text", "")[:200].replace("\n", " ")
            print(f"      text:   {snippet}...")
        print()


if __name__ == "__main__":
    run_tests()
