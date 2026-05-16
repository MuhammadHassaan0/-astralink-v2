#!/usr/bin/env python3
"""
ingest_all.py
AstraLink Arena — master ingestion orchestrator.

Runs the full 8-step pipeline for all 6 creator twins in parallel where possible.
Each personality's steps 1-6 run sequentially; personalities run concurrently.
Steps 7 (relationship graph) and 8 (system prompts) run after all profiles are done.

Usage:
    python ingest_all.py                    # full pipeline, all 6 personalities
    python ingest_all.py --slug mrbeast     # single personality only
    python ingest_all.py --steps 4,5        # run only specific steps for all
    python ingest_all.py --skip-download    # skip steps 1-3 (use existing transcripts)
"""

import argparse
import asyncio
import json
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

# Ensure dotenv is loaded before any ingestion imports
from ingestion.utils import load_env, get_logger

load_env()

from ingestion.config import PERSONALITIES, SLUG_LIST, DATA_DIR, PROMPT_DIR
from ingestion import (
    step1_youtube,
    step2_twitter,
    step3_podcasts,
    step4_chunker,
    step5_embedder,
    step6_profile,
    step7_graph,
    step8_prompts,
)

log = get_logger("ingest_all")


# ── Progress tracking ─────────────────────────────────────────────────────────

class PipelineResult:
    def __init__(self, slug: str):
        self.slug       = slug
        self.yt_count   = 0
        self.tw_count   = 0
        self.pod_count  = 0
        self.chunk_count = 0
        self.vector_count = 0
        self.profile_ok  = False
        self.prompt_ok   = False
        self.errors: list[str] = []


def run_step(label: str, fn, *args) -> tuple:
    """Run a step, capture result + any exception."""
    try:
        result = fn(*args)
        return result, None
    except Exception as exc:
        return None, f"{label}: {exc}"


# ── Per-personality pipeline ──────────────────────────────────────────────────

def run_personality_pipeline(
    slug: str,
    run_steps: set[int],
    skip_download: bool,
) -> PipelineResult:
    res = PipelineResult(slug)
    cfg = PERSONALITIES[slug]
    log.info(f"\n{'='*60}")
    log.info(f"  Starting pipeline: {cfg['name']} ({slug})")
    log.info(f"{'='*60}")

    # Step 1 — YouTube
    if 1 in run_steps and not skip_download:
        count, err = run_step("step1", step1_youtube.run, slug)
        if err:
            res.errors.append(err)
            log.error(f"[{slug}] Step 1 FAILED: {err}")
        else:
            res.yt_count = count or 0

    # Step 2 — Twitter
    if 2 in run_steps and not skip_download:
        count, err = run_step("step2", step2_twitter.run, slug)
        if err:
            res.errors.append(err)
            log.error(f"[{slug}] Step 2 FAILED: {err}")
        else:
            res.tw_count = count or 0

    # Step 3 — Podcasts
    if 3 in run_steps and not skip_download:
        count, err = run_step("step3", step3_podcasts.run, slug)
        if err:
            res.errors.append(err)
            log.error(f"[{slug}] Step 3 FAILED: {err}")
        else:
            res.pod_count = count or 0

    # Step 4 — Chunking
    if 4 in run_steps:
        count, err = run_step("step4", step4_chunker.run, slug)
        if err:
            res.errors.append(err)
            log.error(f"[{slug}] Step 4 FAILED: {err}")
        else:
            res.chunk_count = count or 0

    # Step 5 — Embed + Qdrant
    if 5 in run_steps:
        count, err = run_step("step5", step5_embedder.run, slug)
        if err:
            res.errors.append(err)
            log.error(f"[{slug}] Step 5 FAILED: {err}")
        else:
            res.vector_count = count or 0

    # Step 6 — Profile extraction
    if 6 in run_steps:
        ok, err = run_step("step6", step6_profile.run, slug)
        if err:
            res.errors.append(err)
            log.error(f"[{slug}] Step 6 FAILED: {err}")
        else:
            res.profile_ok = bool(ok)

    return res


# ── Main ──────────────────────────────────────────────────────────────────────

def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="AstraLink Arena ingestion pipeline")
    p.add_argument(
        "--slug", type=str, default=None,
        help="Run pipeline for a single slug (e.g. mrbeast). Default: all 6."
    )
    p.add_argument(
        "--steps", type=str, default="1,2,3,4,5,6,7,8",
        help="Comma-separated list of steps to run (default: all)."
    )
    p.add_argument(
        "--skip-download", action="store_true",
        help="Skip steps 1-3 (YouTube, Twitter, Podcasts). Use existing transcript files."
    )
    p.add_argument(
        "--workers", type=int, default=3,
        help="Max parallel personality workers (default: 3)."
    )
    return p.parse_args()


def main():
    args = parse_args()

    run_steps: set[int] = set(int(s.strip()) for s in args.steps.split(",") if s.strip())
    slugs = [args.slug] if args.slug else SLUG_LIST
    t_start = time.time()

    log.info("╔══════════════════════════════════════════════════════════╗")
    log.info("║         AstraLink Arena — Ingestion Pipeline             ║")
    log.info("╚══════════════════════════════════════════════════════════╝")
    log.info(f"  Personalities : {', '.join(slugs)}")
    log.info(f"  Steps         : {sorted(run_steps)}")
    log.info(f"  Skip download : {args.skip_download}")
    log.info(f"  Workers       : {args.workers}")
    log.info("")

    # ── Steps 1-6 in parallel per personality ──
    results: dict[str, PipelineResult] = {}
    per_person_steps = run_steps - {7, 8}

    if per_person_steps:
        log.info(f"Running per-personality steps {sorted(per_person_steps)} in parallel...")
        with ThreadPoolExecutor(max_workers=args.workers) as pool:
            futures = {
                pool.submit(
                    run_personality_pipeline, slug, per_person_steps, args.skip_download
                ): slug
                for slug in slugs
            }
            for fut in as_completed(futures):
                slug = futures[fut]
                try:
                    res = fut.result()
                    results[slug] = res
                    log.info(f"[{slug}] Pipeline steps 1-6 complete")
                except Exception as exc:
                    log.error(f"[{slug}] Pipeline crashed: {exc}")
                    results[slug] = PipelineResult(slug)
                    results[slug].errors.append(str(exc))

    # ── Step 7 — Relationship graph (after all profiles exist) ──
    if 7 in run_steps:
        log.info("\n─── Step 7: Building relationship graph ───")
        ok, err = run_step("step7", step7_graph.run)
        if err:
            log.error(f"Step 7 FAILED: {err}")

    # ── Step 8 — System prompts (parallel per slug) ──
    if 8 in run_steps:
        log.info("\n─── Step 8: Generating system prompts ───")
        with ThreadPoolExecutor(max_workers=min(len(slugs), 3)) as pool:
            futures = {
                pool.submit(step8_prompts.run, slug): slug
                for slug in slugs
            }
            for fut in as_completed(futures):
                slug = futures[fut]
                try:
                    ok = fut.result()
                    if slug in results:
                        results[slug].prompt_ok = bool(ok)
                except Exception as exc:
                    log.error(f"[{slug}] Step 8 crashed: {exc}")

    # ── Final summary ──────────────────────────────────────────────
    elapsed = time.time() - t_start
    log.info("\n")
    log.info("╔══════════════════════════════════════════════════════════╗")
    log.info("║                  INGESTION SUMMARY                      ║")
    log.info("╚══════════════════════════════════════════════════════════╝")
    log.info(f"  {'Slug':<14} {'YT':>4} {'TW':>5} {'POD':>4} {'Chunks':>7} {'Vectors':>8} {'Profile':>8} {'Prompt':>7}")
    log.info(f"  {'-'*70}")

    total_chunks  = 0
    total_vectors = 0

    for slug in slugs:
        res = results.get(slug, PipelineResult(slug))
        profile_icon = "✓" if res.profile_ok else "✗"
        prompt_icon  = "✓" if res.prompt_ok  else "✗"
        log.info(
            f"  {slug:<14} {res.yt_count:>4} {res.tw_count:>5} {res.pod_count:>4} "
            f"{res.chunk_count:>7} {res.vector_count:>8} {profile_icon:>8} {prompt_icon:>7}"
        )
        total_chunks  += res.chunk_count
        total_vectors += res.vector_count

    log.info(f"  {'-'*70}")
    log.info(f"  {'TOTAL':<14} {'':>4} {'':>5} {'':>4} {total_chunks:>7} {total_vectors:>8}")
    log.info(f"\n  Total time: {elapsed:.0f}s ({elapsed/60:.1f} min)")
    log.info("")

    # Verify Qdrant collections if step 5 ran
    if 5 in run_steps:
        log.info("── Qdrant collection verification ──")
        try:
            from ingestion.utils import get_env
            from qdrant_client import QdrantClient
            client = QdrantClient(
                url=get_env("QDRANT_URL"),
                api_key=get_env("QDRANT_API_KEY"),
                timeout=30,
            )
            collections = {c.name for c in client.get_collections().collections}
            for slug in slugs:
                if slug in collections:
                    count = client.count(slug).count
                    log.info(f"  [{slug}] ✓ live — {count:,} vectors")
                else:
                    log.info(f"  [{slug}] ✗ NOT FOUND in Qdrant")
        except Exception as exc:
            log.warning(f"  Qdrant verification failed: {exc}")

    # Surface any errors
    all_errors = [(s, e) for s in slugs for e in results.get(s, PipelineResult(s)).errors]
    if all_errors:
        log.info("\n── Errors encountered ──")
        for slug, err in all_errors:
            log.error(f"  [{slug}] {err}")

    log.info("\n✓ Ingestion complete.\n")


if __name__ == "__main__":
    main()
