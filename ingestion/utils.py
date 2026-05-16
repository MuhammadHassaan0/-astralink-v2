"""
ingestion/utils.py
Shared logging, retry helpers, and env loading.
"""

import json
import logging
import os
import time
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

_ENV_LOADED = False


def load_env():
    global _ENV_LOADED
    if _ENV_LOADED:
        return
    env_path = Path(__file__).parent.parent.parent / "kai" / ".env"
    if env_path.exists():
        load_dotenv(env_path)
    _ENV_LOADED = True


def get_env(key: str, required: bool = True) -> str | None:
    load_env()
    val = os.getenv(key)
    if required and not val:
        raise RuntimeError(f"Missing required env var: {key}")
    return val


def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler()
        handler.setFormatter(logging.Formatter(
            "%(asctime)s [%(name)s] %(levelname)s  %(message)s",
            datefmt="%H:%M:%S",
        ))
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
    return logger


def save_json(path: Path, data: Any, indent: int = 2) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=indent, ensure_ascii=False), encoding="utf-8")


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def retry(fn, attempts: int = 3, delay: float = 2.0, label: str = ""):
    for i in range(attempts):
        try:
            return fn()
        except Exception as exc:
            if i == attempts - 1:
                raise
            logging.warning(f"  Retry {i+1}/{attempts} for {label}: {exc}")
            time.sleep(delay * (i + 1))
