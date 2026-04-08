#!/usr/bin/env python3
"""Weather CLI."""
import argparse
import os
import logging

from src.weather_client import WeatherClient

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    parser = argparse.ArgumentParser(description="Get current weather")
    parser.add_argument("city")
    parser.add_argument("--api-key", default=os.getenv("WEATHER_API_KEY"))
    parser.add_argument("--timeout", type=float, default=10.0, help="Request timeout in seconds")
    args = parser.parse_args()

    client = WeatherClient(args.api_key, timeout=args.timeout)
    weather = client.get_weather(args.city)
    print(weather)

if __name__ == "__main__":
    main()
