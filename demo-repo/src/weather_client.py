import requests

USER_AGENT = "MOOweatherCLI/0.1.0"


def get_weather(city):
    url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid=KEY"
    headers = {"User-Agent": USER_AGENT}
    resp = requests.get(url, headers=headers)
    return resp.json()