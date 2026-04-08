from flask import Flask, jsonify, request
from src.weather_client import WeatherClient
from src.cache import WeatherCache

app = Flask(__name__)
client = WeatherClient(api_key="demo-key")
cache = WeatherCache(ttl_seconds=300)


@app.route("/weather")
def get_weather():
    city = request.args.get("city")
    if not city:
        return jsonify({"error": "city parameter is required"}), 400

    cached = cache.get(city)
    if cached:
        return jsonify({"source": "cache", **cached})

    try:
        data = client.fetch_weather(city)
        cache.set(city, data)
        return jsonify({"source": "api", **data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/health")
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(port=5000, debug=True)
