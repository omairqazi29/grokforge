from app.ai.provider import AIProvider
from app.ai.mock_provider import MockProvider
from app.config import settings


def get_ai_provider() -> AIProvider:
    if settings.xai_api_key:
        from app.ai.grok_provider import GrokProvider
        return GrokProvider(
            api_key=settings.xai_api_key,
            model=settings.xai_model,
        )
    return MockProvider()
