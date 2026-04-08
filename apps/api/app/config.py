from typing import List

from pydantic import ConfigDict
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    model_config = ConfigDict(env_prefix="GROKFORGE_", env_file=".env")

    database_url: str = "sqlite+aiosqlite:///./grokforge.db"
    xai_api_key: str = ""
    xai_base_url: str = "https://api.x.ai/v1"
    xai_model: str = "grok-4-1-fast"
    cors_origins: List[str] = ["http://localhost:3000"]


settings = Settings()
