from src.formatters import format_temperature, format_wind_speed, format_weather_summary


class TestFormatTemperature:
    def test_celsius(self):
        assert format_temperature(20.0) == "20.0°C"

    def test_fahrenheit(self):
        assert format_temperature(0.0, "F") == "32.0°F"

    def test_kelvin(self):
        assert format_temperature(0.0, "K") == "273.1K"


class TestFormatWindSpeed:
    def test_ms(self):
        assert format_wind_speed(5.0) == "5.0 m/s"

    def test_kmh(self):
        assert format_wind_speed(10.0, "kmh") == "36.0 km/h"

    def test_mph(self):
        assert format_wind_speed(10.0, "mph") == "22.4 mph"


class TestFormatWeatherSummary:
    def test_summary(self):
        data = {
            "city": "London",
            "description": "cloudy",
            "temperature": 15.0,
            "humidity": 70,
            "wind_speed": 5.0,
        }
        result = format_weather_summary(data)
        assert "London" in result
        assert "cloudy" in result
        assert "15.0°C" in result
