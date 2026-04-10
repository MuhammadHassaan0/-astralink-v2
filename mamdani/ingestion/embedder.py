"""
ingestion/embedder.py
Embeds chunks from chunks.json using FastEmbed (dense) + BM25 (sparse),
then upserts into a Qdrant collection called 'mamdani'.
"""

import json
import math
import os
import re
import time
import uuid
from collections import Counter
from pathlib import Path

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
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

CHUNKS_FILE     = Path(__file__).parent / "raw_data" / "chunks.json"
QDRANT_URL      = os.getenv("QDRANT_URL", "http://localhost:6333")
QDRANT_API_KEY  = os.getenv("QDRANT_API_KEY", None)
COLLECTION_NAME = "mamdani"
DENSE_MODEL     = "BAAI/bge-small-en-v1.5"
VECTOR_SIZE     = 384
BATCH_SIZE      = 20


# ── Tokeniser ────────────────────────────────────────────────────────────────

def tokenise(text: str) -> list[str]:
    return re.findall(r"[a-z0-9']+", text.lower())


# ── BM25 sparse vectors ───────────────────────────────────────────────────────

def build_bm25_index(tokenised_corpus: list[list[str]]):
    """Return (bm25 model, vocab dict, idf dict)."""
    bm25  = BM25Okapi(tokenised_corpus)
    vocab: dict[str, int] = {}
    for doc in tokenised_corpus:
        for tok in doc:
            if tok not in vocab:
                vocab[tok] = len(vocab)

    N = len(tokenised_corpus)
    df: dict[str, int] = {}
    for doc in tokenised_corpus:
        for tok in set(doc):
            df[tok] = df.get(tok, 0) + 1
    idf = {tok: math.log((N - freq + 0.5) / (freq + 0.5) + 1)
           for tok, freq in df.items()}
    return bm25, vocab, idf


def sparse_vector_for(tokens: list[str],
                      vocab: dict[str, int],
                      idf:   dict[str, float],
                      k1: float = 1.5,
                      b:  float = 0.75,
                      avg_dl: float = 100.0) -> tuple[list[int], list[float]]:
    """BM25 TF*IDF sparse vector for a single document."""
    tf    = Counter(tokens)
    dl    = len(tokens)
    indices, values = [], []
    for term, freq in tf.items():
        if term not in vocab or term not in idf:
            continue
        tf_score = (freq * (k1 + 1)) / (freq + k1 * (1 - b + b * dl / avg_dl))
        score    = tf_score * idf[term]
        if score > 0:
            indices.append(vocab[term])
            values.append(float(score))
    return indices, values


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
    for i in range(0, len(points), BATCH_SIZE):
        batch = points[i : i + BATCH_SIZE]
        client.upsert(collection_name=COLLECTION_NAME, points=batch)
        print(f"  Upserted {min(i + BATCH_SIZE, len(points))}/{len(points)} points...", end="\r")
    print()


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    t0 = time.time()
    print("=== Mamdani Embedder ===\n")

    # 1. Load chunks
    chunks = json.loads(CHUNKS_FILE.read_text())
    texts  = [c["text"] for c in chunks]
    print(f"  Loaded {len(chunks)} chunks\n")

    # 2. Dense embeddings via FastEmbed
    print(f"  Generating dense embeddings with {DENSE_MODEL}...")
    embedder    = TextEmbedding(model_name=DENSE_MODEL)
    dense_vecs  = list(embedder.embed(texts))
    print(f"  Done — {len(dense_vecs)} vectors of dim {len(dense_vecs[0])}\n")

    # 3. BM25 sparse vectors
    print("  Computing BM25 sparse vectors...")
    tokenised   = [tokenise(t) for t in texts]
    avg_dl      = sum(len(d) for d in tokenised) / len(tokenised)
    _, vocab, idf = build_bm25_index(tokenised)
    sparse_vecs = [
        sparse_vector_for(tok, vocab, idf, avg_dl=avg_dl)
        for tok in tokenised
    ]
    print(f"  Done — vocab size: {len(vocab):,} terms\n")

    # 4. Connect to Qdrant & create collection
    print(f"  Connecting to Qdrant at {QDRANT_URL}...")
    client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY, timeout=60)
    ensure_collection(client)
    print()

    # 5. Build PointStructs
    points = []
    for i, (chunk, dense, (sp_idx, sp_val)) in enumerate(
        zip(chunks, dense_vecs, sparse_vecs)
    ):
        points.append(
            PointStruct(
                id=str(uuid.uuid4()),
                vector={
                    "dense":  dense.tolist(),
                    "sparse": SparseVector(indices=sp_idx, values=sp_val),
                },
                payload={
                    "chunk_id":       chunk["chunk_id"],
                    "doc_id":         chunk["doc_id"],
                    "source_type":    chunk["source_type"],
                    "source_url":     chunk["source_url"],
                    "title":          chunk["title"],
                    "published_at":   chunk["published_at"],
                    "speaker":        chunk["speaker"],
                    "topic":          chunk["topic"],
                    "is_quote":       chunk["is_quote"],
                    "is_recent":      chunk["is_recent"],
                    "priority_score": chunk["priority_score"],
                    "text":           chunk["text"],
                    "word_count":     chunk["word_count"],
                    "token_estimate": chunk["token_estimate"],
                },
            )
        )

    # 6. Upsert
    print(f"  Upserting {len(points)} points in batches of {BATCH_SIZE}...")
    upsert_batches(client, points)

    # 7. Verify
    info   = client.get_collection(COLLECTION_NAME)
    count  = client.count(COLLECTION_NAME).count
    elapsed = time.time() - t0

    print(f"\n── Results ───────────────────────────")
    print(f"  Vectors upserted:    {count}")
    print(f"  Collection status:   {info.status}")
    print(f"  Dense vector size:   {info.config.params.vectors['dense'].size}d  "
          f"{info.config.params.vectors['dense'].distance}")
    print(f"  Sparse index:        BM25 (vocab {len(vocab):,} terms)")
    print(f"  Time taken:          {elapsed:.1f}s")


if __name__ == "__main__":
    main()
