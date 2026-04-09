class PlainFormatter:
    def format(self, data):
        return f"MOOweather in {data['name']}: {data['main']['temp']}C"

class JSONFormatter:
    def format(self, data):
        import json
        return json.dumps(data, indent=2)