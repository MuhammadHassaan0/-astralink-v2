"""
kai/ingestion/embedder.py
Embed chunked Kai Trump content and upsert into Qdrant Cloud.

Usage:
    python3.12 ingestion/embedder.py
"""

import json
import os
import time
from pathlib import Path

from dotenv import load_dotenv
from fastembed import TextEmbedding
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    PayloadSchemaType,
    PointStruct,
    SparseIndexParams,
    SparseVector,
    SparseVectorParams,
    VectorParams,
)
from rank_bm25 import BM25Okapi
import re

ROOT = Path(__file__).parent.parent
load_dotenv(ROOT / ".env")

QDRANT_URL      = os.getenv("QDRANT_URL", "http://localhost:6333")
QDRANT_API_KEY  = os.getenv("QDRANT_API_KEY", None)
COLLECTION_NAME = "kai"
VECTOR_SIZE     = 384   # BAAI/bge-small-en-v1.5
DENSE_MODEL     = "BAAI/bge-small-en-v1.5"
BATCH_SIZE      = 20
CHUNKS_FILE     = ROOT / "ingestion" / "raw_data" / "chunks.json"


# ── Tokeniser ─────────────────────────────────────────────────────────────────

def tokenise(text: str) -> list[str]:
    return re.findall(r"[a-z0-9']+", text.lower())


# ── Qdrant helpers ────────────────────────────────────────────────────────────

def ensure_collection(client: QdrantClient):
    existing = [c.name for c in client.get_collections().collections]
    if COLLECTION_NAME in existing:
        print(f"  Collection '{COLLECTION_NAME}' already exists — recreating.")
        client.delete_collection(COLLECTION_NAME)

    client.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config={
            "dense": VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
        },
        sparse_vectors_config={
            "sparse": SparseVectorParams(
                index=SparseIndexParams(on_disk=False)
            ),
        },
    )
    print(f"  Created collection '{COLLECTION_NAME}' (dense={VECTOR_SIZE}d cosine + sparse BM25)")

    # Create payload indexes for filtered fields
    for field, schema in [
        ("topic",          PayloadSchemaType.KEYWORD),
        ("is_recent",      PayloadSchemaType.BOOL),
        ("is_quote",       PayloadSchemaType.BOOL),
        ("priority_score", PayloadSchemaType.INTEGER),
    ]:
        client.create_payload_index(
            collection_name=COLLECTION_NAME,
            field_name=field,
            field_schema=schema,
        )
    print("  Payload indexes created: topic, is_recent, is_quote, priority_score")


def upsert_batches(client: QdrantClient, points: list[PointStruct]):
    total = len(points)
    for i in range(0, total, BATCH_SIZE):
        batch = points[i : i + BATCH_SIZE]
        client.upsert(collection_name=COLLECTION_NAME, points=batch)
        print(f"  Upserted {min(i + BATCH_SIZE, total)}/{total} points...", end="  ")
    print()


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("=== Kai Embedder ===\n")
    t0 = time.time()

    # Load chunks
    chunks = json.loads(CHUNKS_FILE.read_text())
    texts  = [c["text"] for c in chunks]
    print(f"  Loaded {len(chunks)} chunks\n")

    # Dense embeddings
    print(f"  Generating dense embeddings with {DENSE_MODEL}...")
    embedder     = TextEmbedding(model_name=DENSE_MODEL)
    dense_vecs   = list(embedder.embed(texts))
    print(f"  Done — {len(dense_vecs)} vectors of dim {len(dense_vecs[0])}\n")

    # BM25 sparse vectors
    print("  Computing BM25 sparse vectors...")
    tokenised    = [tokenise(t) for t in texts]
    bm25         = BM25Okapi(tokenised)

    # Build vocab
    vocab: dict[str, int] = {}
    for toks in tokenised:
        for tok in toks:
            if tok not in vocab:
                vocab[tok] = len(vocab)

    def to_sparse(scores: list[float]) -> SparseVector:
        indices = [vocab[tok] for tok in vocab]
        values  = [float(scores[vocab[tok]]) if vocab[tok] < len(scores) else 0.0
                   for tok in vocab]
        # Keep only non-zero
        pairs   = [(i, v) for i, v in zip(indices, values) if v > 0]
        if not pairs:
            return SparseVector(indices=[0], values=[0.0])
        idx, val = zip(*pairs)
        return SparseVector(indices=list(idx), values=list(val))

    sparse_vecs = []
    for toks in tokenised:
        scores = bm25.get_scores(toks)
        sparse_vecs.append(to_sparse(scores))

    print(f"  Done — vocab size: {len(vocab):,} terms\n")

    # Connect to Qdrant
    print(f"  Connecting to Qdrant at {QDRANT_URL}...")
    client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY, timeout=60)
    ensure_collection(client)

    # Build points
    points = []
    for i, (chunk, dvec, svec) in enumerate(zip(chunks, dense_vecs, sparse_vecs)):
        points.append(PointStruct(
            id      = i,
            vector  = {"dense": dvec.tolist(), "sparse": svec},
            payload = chunk,
        ))

    # Upsert
    print(f"\n  Upserting {len(points)} points in batches of {BATCH_SIZE}...")
    upsert_batches(client, points)

    # Verify
    info        = client.get_collection(COLLECTION_NAME)
    status      = str(info.status).lower()
    dense_conf  = info.config.params.vectors["dense"]

    print("\n── Results ───────────────────────────")
    print(f"  Vectors upserted:    {len(points)}")
    print(f"  Collection status:   {status}")
    print(f"  Dense vector size:   {dense_conf.size}d  {dense_conf.distance}")
    print(f"  Sparse index:        BM25 (vocab {len(vocab):,} terms)")
    print(f"  Time taken:          {time.time() - t0:.1f}s")


if __name__ == "__main__":
    main()
