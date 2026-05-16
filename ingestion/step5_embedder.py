"""
ingestion/step5_embedder.py
Embed all chunks with FastEmbed (BAAI/bge-small-en-v1.5) and upsert into
Qdrant Cloud using hybrid dense + BM25 sparse indexing.

One Qdrant collection per personality: mrbeast, ishowspeed, kaicenat,
ksi, loganpaul, jakepaul

Outputs → confirmation logs; Qdrant collections populated.
"""

import re
import sys
import time
from pathlib import Path

from .config import DATA_DIR, DENSE_MODEL, VECTOR_SIZE, SLUG_LIST
from .utils import get_env, get_logger, load_json

log = get_logger("step5")

BATCH_SIZE = 32


# ── Qdrant collection setup ───────────────────────────────────────────────────

def ensure_collection(client, collection_name: str):
    from qdrant_client.models import (
        Distance,
        PayloadSchemaType,
        SparseIndexParams,
        SparseVectorParams,
        VectorParams,
    )

    existing = {c.name for c in client.get_collections().collections}
    if collection_name in existing:
        log.info(f"  Collection '{collection_name}' exists — recreating")
        client.delete_collection(collection_name)

    client.create_collection(
        collection_name=collection_name,
        vectors_config={
            "dense": VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
        },
        sparse_vectors_config={
            "sparse": SparseVectorParams(
                index=SparseIndexParams(on_disk=False)
            ),
        },
    )

    for field, schema in [
        ("source_type",                 PayloadSchemaType.KEYWORD),
        ("personality_slug",            PayloadSchemaType.KEYWORD),
        ("publish_date",                PayloadSchemaType.KEYWORD),
        ("is_opinion",                  PayloadSchemaType.BOOL),
        ("is_about_another_creator",    PayloadSchemaType.BOOL),
    ]:
        client.create_payload_index(
            collection_name=collection_name,
            field_name=field,
            field_schema=schema,
        )

    log.info(f"  Created '{collection_name}' (dense={VECTOR_SIZE}d + sparse BM25) + payload indexes")


# ── BM25 sparse vectors ───────────────────────────────────────────────────────

def tokenise(text: str) -> list[str]:
    return re.findall(r"[a-z0-9']+", text.lower())


def build_bm25_sparse(texts: list[str]):
    from rank_bm25 import BM25Okapi

    tokenised = [tokenise(t) for t in texts]
    bm25      = BM25Okapi(tokenised)

    vocab: dict[str, int] = {}
    for toks in tokenised:
        for tok in toks:
            if tok not in vocab:
                vocab[tok] = len(vocab)

    return bm25, tokenised, vocab


def to_sparse_vector(bm25, query_toks: list[str], vocab: dict):
    from qdrant_client.models import SparseVector

    scores = bm25.get_scores(query_toks)
    pairs  = [(vocab[tok], float(scores[vocab[tok]]))
              for tok in vocab
              if vocab[tok] < len(scores) and scores[vocab[tok]] > 0]
    if not pairs:
        return SparseVector(indices=[0], values=[0.0])
    idx, val = zip(*pairs)
    return SparseVector(indices=list(idx), values=list(val))


# ── Upsert ────────────────────────────────────────────────────────────────────

def upsert_all(client, collection_name: str, chunks: list[dict],
               dense_vecs, sparse_vecs, slug: str):
    from qdrant_client.models import PointStruct

    total  = len(chunks)
    points = [
        PointStruct(
            id=i,
            vector={"dense": dv.tolist(), "sparse": sv},
            payload=chunk,
        )
        for i, (chunk, dv, sv) in enumerate(zip(chunks, dense_vecs, sparse_vecs))
    ]

    for i in range(0, total, BATCH_SIZE):
        batch = points[i: i + BATCH_SIZE]
        client.upsert(collection_name=collection_name, points=batch)
        pct = min(i + BATCH_SIZE, total)
        log.info(f"[{slug}]   Upserted {pct}/{total}")

    log.info(f"[{slug}]   All {total} points upserted")


# ── Main ──────────────────────────────────────────────────────────────────────

def run(slug: str) -> int:
    from fastembed import TextEmbedding
    from qdrant_client import QdrantClient

    t0         = time.time()
    chunks_file = DATA_DIR / slug / "chunks.json"
    if not chunks_file.exists():
        log.warning(f"[{slug}] No chunks.json found — run step 4 first")
        return 0

    chunks = load_json(chunks_file)
    if not chunks:
        log.warning(f"[{slug}] chunks.json is empty")
        return 0

    log.info(f"[{slug}] === Step 5: Embedding + Qdrant upload ({len(chunks)} chunks) ===")

    texts = [c["text"] for c in chunks]

    # Dense embeddings
    log.info(f"[{slug}]   Dense embeddings with {DENSE_MODEL}...")
    embedder   = TextEmbedding(model_name=DENSE_MODEL)
    dense_vecs = list(embedder.embed(texts))
    log.info(f"[{slug}]   Dense done — dim={len(dense_vecs[0])}")

    # Sparse BM25
    log.info(f"[{slug}]   Building BM25 sparse vectors...")
    bm25, tokenised, vocab = build_bm25_sparse(texts)
    sparse_vecs = [to_sparse_vector(bm25, toks, vocab) for toks in tokenised]
    log.info(f"[{slug}]   Sparse done — vocab {len(vocab):,} terms")

    # Connect to Qdrant
    qdrant_url = get_env("QDRANT_URL")
    qdrant_key = get_env("QDRANT_API_KEY")
    client     = QdrantClient(url=qdrant_url, api_key=qdrant_key, timeout=60)
    log.info(f"[{slug}]   Connected to Qdrant at {qdrant_url}")

    ensure_collection(client, slug)
    upsert_all(client, slug, chunks, dense_vecs, sparse_vecs, slug)

    # Verify
    info   = client.get_collection(slug)
    status = str(info.status).lower()
    count  = client.count(slug).count

    log.info(f"[{slug}] Step 5 done — {count} vectors in '{slug}' ({status}) [{time.time()-t0:.0f}s]")
    return count


if __name__ == "__main__":
    slug = sys.argv[1] if len(sys.argv) > 1 else "mrbeast"
    run(slug)
