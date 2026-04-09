import pytest
import os
from src.cache import get_cache, set_cache


def test_cache(tmp_path):
    os.chdir(tmp_path)
    data = {"temp": 20}
    set_cache("London", data)
    assert get_cache("London") == data
    assert os.path.exists(".mooweather_cache/London.json")