import json
import os
from typing import Optional

_CACHE_DIR = ".mooweather_cache"


def get_cache(city: str) -> Optional[dict]:
    path = os.path.join(_CACHE_DIR, f"{city}.json")
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f)
    return None


def set_cache(city: str, data: dict):
    os.makedirs(_CACHE_DIR, exist_ok=True)
    path = os.path.join(_CACHE_DIR, f"{city}.json")
    with open(path, "w") as f:
        json.dump(data, f)