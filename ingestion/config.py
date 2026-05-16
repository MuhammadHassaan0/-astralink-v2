"""
ingestion/config.py
Central configuration for all six creator twin ingestion pipelines.
"""

from pathlib import Path

ROOT      = Path(__file__).parent.parent
DATA_DIR  = ROOT / "data"
PROMPT_DIR = ROOT / "prompts"

QDRANT_URL     = None   # loaded from .env at runtime
QDRANT_API_KEY = None
GROQ_API_KEY   = None

VECTOR_SIZE = 384          # BAAI/bge-small-en-v1.5
DENSE_MODEL = "BAAI/bge-small-en-v1.5"
GROQ_MODEL  = "llama-3.3-70b-versatile"

PERSONALITIES: dict[str, dict] = {
    "mrbeast": {
        "name":             "MrBeast",
        "full_name":        "Jimmy Donaldson",
        "youtube_channel":  "https://www.youtube.com/@MrBeast/videos",
        "twitter_handle":   "MrBeast",
        "podcast_queries": [
            "MrBeast full interview 2024",
            "Jimmy Donaldson podcast long form",
            "MrBeast talks philanthropy business interview",
            "MrBeast Hot Ones",
            "MrBeast Lex Fridman",
        ],
    },
    "ishowspeed": {
        "name":             "IShowSpeed",
        "full_name":        "Darren Watkins Jr",
        "youtube_channel":  "https://www.youtube.com/@IShowSpeed/videos",
        "twitter_handle":   "ishowspeed",
        "podcast_queries": [
            "IShowSpeed full interview 2024",
            "IShowSpeed podcast long form",
            "IShowSpeed Kai Cenat together interview",
            "Darren Watkins Jr interview",
            "IShowSpeed No Jumper",
        ],
    },
    "kaicenat": {
        "name":             "Kai Cenat",
        "full_name":        "Kai Cenat",
        "youtube_channel":  "https://www.youtube.com/@KaiCenat/videos",
        "twitter_handle":   "KaiCenat",
        "podcast_queries": [
            "Kai Cenat full interview 2024",
            "Kai Cenat podcast long form",
            "Kai Cenat DJ Akademiks",
            "Kai Cenat interview streamer",
            "Kai Cenat No Jumper interview",
        ],
    },
    "ksi": {
        "name":             "KSI",
        "full_name":        "Olajide Olatunji",
        "youtube_channel":  "https://www.youtube.com/@KSI/videos",
        "twitter_handle":   "KSI",
        "podcast_queries": [
            "KSI full interview 2024 long form",
            "KSI podcast 2023 2024",
            "KSI Logan Paul interview together",
            "KSI Speak podcast",
            "KSI True Geordie interview",
        ],
    },
    "loganpaul": {
        "name":             "Logan Paul",
        "full_name":        "Logan Paul",
        "youtube_channel":  "https://www.youtube.com/@LoganPaul/videos",
        "twitter_handle":   "LoganPaul",
        "podcast_queries": [
            "Logan Paul IMPAULSIVE full episode",
            "Logan Paul interview 2024 long form",
            "Logan Paul Lex Fridman",
            "Logan Paul business interview",
            "Logan Paul KSI interview",
        ],
    },
    "jakepaul": {
        "name":             "Jake Paul",
        "full_name":        "Jake Paul",
        "youtube_channel":  "https://www.youtube.com/@JakePaul/videos",
        "twitter_handle":   "jakepaul",
        "podcast_queries": [
            "Jake Paul full interview 2024 long form",
            "Jake Paul podcast 2023 2024",
            "Jake Paul boxing interview",
            "Jake Paul Joe Rogan",
            "Jake Paul business startup interview",
        ],
    },
}

SLUG_LIST = list(PERSONALITIES.keys())

OTHER_CREATOR_NAMES = {
    "mrbeast":    ["MrBeast", "Jimmy", "Jimmy Donaldson"],
    "ishowspeed": ["IShowSpeed", "Speed", "Darren"],
    "kaicenat":   ["Kai Cenat", "Kai"],
    "ksi":        ["KSI", "JJ", "Olajide"],
    "loganpaul":  ["Logan Paul", "Logan"],
    "jakepaul":   ["Jake Paul", "Jake"],
}

ALL_CREATOR_NAMES: list[str] = [
    name
    for names in OTHER_CREATOR_NAMES.values()
    for name in names
]
