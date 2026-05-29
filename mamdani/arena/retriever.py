"""
arena/retriever.py
Hybrid Qdrant retriever for a single creator twin collection.

Uses dense (BAAI/bge-small-en-v1.5) + BM25 sparse search with
Reciprocal Rank Fusion.  Falls back gracefully to dense-only if the
collection doesn't yet exist (ingestion not yet run).
"""

import logging
import math
import os
import re
from pathlib import Path
from typing import Optional

log = logging.getLogger("arena.retriever")

DENSE_MODEL  = "BAAI/bge-small-en-v1.5"
TOP_K_SEARCH = 15
TOP_K_RETURN = 5
RRF_K        = 60

VALID_SLUGS = {"mrbeast", "ishowspeed", "kaicenat", "ksi", "loganpaul", "jakepaul", "garyvee", "kaitrump"}

# ── Singleton embedder shared across all twin retrievers ──────────────────────
_embedder = None

def _get_embedder():
    global _embedder
    if _embedder is None:
        from fastembed import TextEmbedding
        _embedder = TextEmbedding(model_name=DENSE_MODEL)
        log.info("Arena embedder loaded: %s", DENSE_MODEL)
    return _embedder


# ── Tokeniser ─────────────────────────────────────────────────────────────────

def _tokenise(text: str) -> list[str]:
    return re.findall(r"[a-z0-9']+", text.lower())


def _build_query_sparse(query: str) -> tuple[list[int], list[float]]:
    """
    Build a TF-based sparse query vector (term presence, no IDF needed at
    query time — Qdrant scores against the stored BM25 corpus vectors).
    Assigns each unique query term a weight proportional to its frequency.
    """
    tokens = _tokenise(query)
    if not tokens:
        return [], []
    tf: dict[str, int] = {}
    for t in tokens:
        tf[t] = tf.get(t, 0) + 1

    # Deterministic token → index: hash mod 2^20 to stay within u32
    indices, values = [], []
    for tok, freq in tf.items():
        idx = hash(tok) % (2 ** 20)
        # IDF ≈ 1 for unknown corpus — use normalised TF
        val = freq / len(tokens)
        indices.append(idx)
        values.append(float(val))
    return indices, values


# ── RRF fusion ────────────────────────────────────────────────────────────────

def _rrf(ranked_lists: list[list[str]], k: int = RRF_K) -> list[tuple[str, float]]:
    scores: dict[str, float] = {}
    for ranked in ranked_lists:
        for rank, cid in enumerate(ranked):
            scores[cid] = scores.get(cid, 0.0) + 1.0 / (k + rank + 1)
    return sorted(scores.items(), key=lambda x: -x[1])


# ── Main retrieve function ────────────────────────────────────────────────────

def retrieve(
    query: str,
    slug: str,
    qdrant_url: str,
    qdrant_api_key: Optional[str],
    top_k: int = TOP_K_RETURN,
) -> list[dict]:
    """
    Hybrid retrieve top_k chunks from a twin's Qdrant collection.
    Returns list of payload dicts enriched with rrf_score.
    Silently returns [] if collection doesn't exist.
    """
    if slug not in VALID_SLUGS:
        log.warning("Unknown slug: %s", slug)
        return []

    try:
        from qdrant_client import QdrantClient
        from qdrant_client.models import SparseVector, NearestQuery, QueryRequest
    except ImportError:
        log.error("qdrant-client not installed")
        return []

    client = QdrantClient(url=qdrant_url, api_key=qdrant_api_key, timeout=15)

    # Check collection exists
    try:
        existing = {c.name for c in client.get_collections().collections}
        if slug not in existing:
            log.warning("[%s] Qdrant collection not found — returning empty context", slug)
            return []
    except Exception as exc:
        log.error("[%s] Qdrant collections check failed: %s", slug, exc)
        return []

    # Dense vector
    try:
        embedder  = _get_embedder()
        dense_vec = list(embedder.embed([query]))[0].tolist()
    except Exception as exc:
        log.error("[%s] Embedding failed: %s", slug, exc)
        return []

    # Sparse vector
    sp_idx, sp_val = _build_query_sparse(query)

    try:
        requests = [
            QueryRequest(
                query=NearestQuery(nearest=dense_vec),
                using="dense",
                limit=TOP_K_SEARCH,
                with_payload=True,
            ),
        ]
        if sp_idx:
            requests.append(
                QueryRequest(
                    query=NearestQuery(
                        nearest=SparseVector(indices=sp_idx, values=sp_val)
                    ),
                    using="sparse",
                    limit=TOP_K_SEARCH,
                    with_payload=True,
                )
            )

        results = client.query_batch_points(collection_name=slug, requests=requests)
        dense_hits  = results[0].points
        sparse_hits = results[1].points if len(results) > 1 else []

    except Exception as exc:
        log.error("[%s] Qdrant query failed: %s", slug, exc)
        return []

    payload_map: dict[str, dict] = {}
    for hit in dense_hits + sparse_hits:
        pid = str(hit.id)
        if pid not in payload_map:
            payload_map[pid] = hit.payload or {}

    dense_ids  = [str(h.id) for h in dense_hits]
    sparse_ids = [str(h.id) for h in sparse_hits]
    fused      = _rrf([dense_ids, sparse_ids] if sparse_ids else [dense_ids])

    top = []
    for chunk_id, rrf_score in fused[:top_k]:
        payload = payload_map.get(chunk_id, {})
        top.append({**payload, "rrf_score": round(rrf_score, 6), "_id": chunk_id})

    log.debug("[%s] Retrieved %d chunks for: %s", slug, len(top), query[:60])
    return top
