import pytest
from src.formatters import PlainFormatter

SAMPLE_DATA = {"name": "London", "main": {"temp": 20}}


def test_plain_formatter():
    fmt = PlainFormatter()
    assert "MOOweather in London" in fmt.format(SAMPLE_DATA)