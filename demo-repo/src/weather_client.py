import requests


class WeatherClient:
    BASE_URL = "https://api.openweathermap.org/data/2.5/weather"

    def __init__(self, api_key: str, timeout: int = 10):
        self.api_key = api_key
        self.timeout = timeout

    def fetch_weather(self, city: str) -> dict:
        """Fetch current weather for a city. No retry logic — fails on first error."""
        response = requests.get(
            self.BASE_URL,
            params={"q": city, "appid": self.api_key, "units": "metric"},
            timeout=self.timeout,
        )
        response.raise_for_status()
        data = response.json()

        return {
            "city": data["name"],
            "temperature": data["main"]["temp"],
            "humidity": data["main"]["humidity"],
            "description": data["weather"][0]["description"],
            "wind_speed": data["wind"]["speed"],
        }
