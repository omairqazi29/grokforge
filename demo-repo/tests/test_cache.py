import time
from src.cache import WeatherCache


class TestWeatherCache:
    def test_set_and_get(self):
        cache = WeatherCache(ttl_seconds=60)
        cache.set("london", {"temperature": 15.0})
        assert cache.get("london") == {"temperature": 15.0}

    def test_miss_returns_none(self):
        cache = WeatherCache()
        assert cache.get("nonexistent") is None

    def test_expired_entry_returns_none(self):
        cache = WeatherCache(ttl_seconds=0)
        cache.set("london", {"temperature": 15.0})
        time.sleep(0.01)
        assert cache.get("london") is None

    def test_clear(self):
        cache = WeatherCache()
        cache.set("london", {"temperature": 15.0})
        cache.set("paris", {"temperature": 18.0})
        cache.clear()
        assert cache.get("london") is None
        assert cache.get("paris") is None
