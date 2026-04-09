#!/usr/bin/env python3
"""Main entry point for MOOweather CLI."""

import argparse
from .weather_client import get_weather
from .formatters import PlainFormatter


def create_parser():
    parser = argparse.ArgumentParser(
        description="MOOweather CLI - Get current weather for a city"
    )
    parser.add_argument("--city", required=True, help="City name")
    return parser


def main():
    parser = create_parser()
    args = parser.parse_args()
    weather = get_weather(args.city)
    formatter = PlainFormatter()
    print(formatter.format(weather))
    print("Powered by MOOweather CLI")


if __name__ == "__main__":
    main()