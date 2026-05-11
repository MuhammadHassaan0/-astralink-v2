"""
retrieval/colter_retriever.py
Hybrid retrieval over the Qdrant 'colter' collection using:
  - Dense vector search (FastEmbed BAAI/bge-small-en-v1.5)
  - BM25 sparse vector search
  - Reciprocal Rank Fusion (RRF, k=60) for result fusion
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
COLLECTION_NAME = "colter"
DENSE_MODEL     = "BAAI/bge-small-en-v1.5"
TOP_K_SEARCH    = 20
TOP_K_RETURN    = 8
RRF_K           = 60

QueryType = Literal["recent_event", "policy_issue", "persona_general", "smalltalk", "general"]

_embedder: TextEmbedding | None = None

def get_embedder() -> TextEmbedding:
    global _embedder
    if _embedder is None:
        _embedder = TextEmbedding(model_name=DENSE_MODEL)
    return _embedder


def tokenise(text: str) -> list[str]:
    return re.findall(r"[a-z0-9']+", text.lower())


_vocab: dict[str, int] | None = None
_idf:   dict[str, float] | None = None

def _load_vocab_idf():
    global _vocab, _idf
    if _vocab is not None:
        return
    chunks_file = Path(__file__).parent.parent / "ingestion" / "raw_data" / "colter_chunks.json"
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


def build_sparse_query_vector(query: str, k1: float = 1.5) -> tuple[list[int], list[float]]:
    _load_vocab_idf()
    tokens  = tokenise(query)
    indices, values = [], []
    seen = set()
    for tok in tokens:
        if tok in _vocab and tok in _idf and tok not in seen:
            tf_score = (1 * (k1 + 1)) / (1 + k1)
            score    = tf_score * _idf[tok]
            if score > 0:
                indices.append(_vocab[tok])
                values.append(float(score))
            seen.add(tok)
    return indices, values


QUERY_PATTERNS: dict[QueryType, list[str]] = {
    "recent_event":   ["latest", "today", "recent", "this week", "2026", "2025",
                       "announced", "new", "just", "now", "update"],
    "policy_issue":   ["rent", "tenant", "eviction", "rso", "rent stabilization",
                       "homeless", "unhoused", "sb79", "sb 79", "displacement",
                       "affordable", "anti-displacement", "ellis act", "just cause",
                       "undocumented", "ice", "immigrant", "small business",
                       "food", "zoning", "transit", "district 13", "east hollywood",
                       "thai town", "little armenia", "los feliz", "silver lake"],
    "persona_general": ["who", "believe", "think", "feel", "values", "why",
                        "stand for", "care about", "vision", "philosophy",
                        "background", "experience", "why running", "obama", "bernie",
                        "neighborhood council"],
    "smalltalk":      ["hello", "hi", "how are you", "hey", "good morning",
                       "good evening", "what's up"],
}

def classify_query(query: str) -> QueryType:
    q = query.lower()
    for qtype, keywords in QUERY_PATTERNS.items():
        if any(kw in q for kw in keywords):
            return qtype
    return "general"


TOPIC_MAP = {
    "housing":       ["rent", "tenant", "eviction", "rso", "affordable", "ellis act",
                      "displacement", "just cause", "rent stabilization", "sb79"],
    "immigration":   ["undocumented", "ice", "immigrant", "sanctuary", "deportation",
                      "thai town", "little armenia"],
    "homelessness":  ["homeless", "unhoused", "encampment", "shelter", "housing first"],
    "small_business":["small business", "permit", "red tape", "commercial rent",
                      "ombudsman", "restaurant", "corridor"],
    "government":    ["transparency", "accountability", "town hall", "constituent",
                      "council", "neighborhood council", "incumbent"],
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
        return Filter(must=[FieldCondition(key="is_quote", match=MatchValue(value=True))])
    return None


def reciprocal_rank_fusion(
    ranked_lists: list[list[str]],
    k: int = RRF_K,
) -> list[tuple[str, float]]:
    scores: dict[str, float] = {}
    for ranked in ranked_lists:
        for rank, chunk_id in enumerate(ranked):
            scores[chunk_id] = scores.get(chunk_id, 0.0) + 1.0 / (k + rank + 1)
    return sorted(scores.items(), key=lambda x: -x[1])


def retrieve(
    query: str,
    top_k: int = TOP_K_RETURN,
    verbose: bool = False,
) -> list[dict]:
    client   = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
    embedder = get_embedder()

    query_type = classify_query(query)
    f          = build_filter(query_type, query)

    if verbose:
        print(f"  Query type: {query_type}")
        print(f"  Filter:     {f}")

    dense_vec      = list(embedder.embed([query]))[0].tolist()
    sp_idx, sp_val = build_sparse_query_vector(query)

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

    payload_map: dict[str, dict] = {}
    for hit in dense_results + sparse_results:
        pid = str(hit.id)
        if pid not in payload_map:
            payload_map[pid] = hit.payload

    dense_ranking  = [str(h.id) for h in dense_results]
    sparse_ranking = [str(h.id) for h in sparse_results]
    fused          = reciprocal_rank_fusion([dense_ranking, sparse_ranking])

    top = []
    for chunk_id, rrf_score in fused[:top_k]:
        payload = payload_map.get(chunk_id, {})
        top.append({**payload, "rrf_score": round(rrf_score, 6), "_id": chunk_id})
    return top


if __name__ == "__main__":
    queries = [
        "How will you protect renters?",
        "What is your position on SB79?",
        "How will you help undocumented neighbors?",
        "Why are you running against the incumbent?",
    ]
    for q in queries:
        print(f"\nQuery: {q!r}")
        results = retrieve(q, top_k=3, verbose=True)
        for i, r in enumerate(results, 1):
            print(f"  [{i}] score={r['rrf_score']}  topic={r.get('topic')}  "
                  f"source={r.get('source_url','')[:60]}")
            print(f"       {r.get('text','')[:150].replace(chr(10),' ')}...")
