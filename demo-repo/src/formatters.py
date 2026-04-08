def format_temperature(celsius: float, unit: str = "C") -> str:
    if unit == "F":
        return f"{celsius * 9/5 + 32:.1f}°F"
    elif unit == "K":
        return f"{celsius + 273.15:.1f}K"
    return f"{celsius:.1f}°C"


def format_wind_speed(ms: float, unit: str = "ms") -> str:
    if unit == "kmh":
        return f"{ms * 3.6:.1f} km/h"
    elif unit == "mph":
        return f"{ms * 2.237:.1f} mph"
    return f"{ms:.1f} m/s"


def format_weather_summary(data: dict) -> str:
    return (
        f"{data['city']}: {data['description']}, "
        f"{format_temperature(data['temperature'])}, "
        f"humidity {data['humidity']}%, "
        f"wind {format_wind_speed(data['wind_speed'])}"
    )
