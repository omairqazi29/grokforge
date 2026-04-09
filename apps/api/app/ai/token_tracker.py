"""
Records API token usage to the database.

Design decision: Separated from provider to follow SRP.
The tracker only writes records; it doesn't know about AI logic.
"""

import logging
from typing import Optional

logger = logging.getLogger(__name__)


class TokenTracker:
    """Persists token usage records to the database."""

    def __init__(self, model: str):
        self.model = model

    async def record(
        self,
        operation: str,
        usage: dict,
        cost_usd: float,
        session_id: Optional[int] = None,
    ) -> None:
        try:
            from app.database import async_session
            from app.models.token_usage import TokenUsage

            async with async_session() as db:
                record = TokenUsage(
                    session_id=session_id,
                    operation=operation,
                    model=self.model,
                    prompt_tokens=usage.get("prompt_tokens", 0),
                    completion_tokens=usage.get("completion_tokens", 0),
                    total_tokens=usage.get("total_tokens", 0),
                    cost_usd=cost_usd,
                )
                db.add(record)
                await db.commit()
        except Exception as e:
            logger.warning("Failed to record token usage: %s", e)
