import os

from app.ai.provider import AIProvider
from app.ai.mock_provider import MockProvider


def get_ai_provider() -> AIProvider:
    api_key = os.environ.get("XAI_API_KEY", "")
    if api_key:
        from app.ai.grok_provider import GrokProvider
        return GrokProvider(api_key=api_key)
    return MockProvider()
