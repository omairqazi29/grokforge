"""
Low-level xAI API client. Handles HTTP requests, authentication, and response parsing.

Design decision: Separated from GrokProvider to follow SRP.
The client handles transport; the provider handles domain logic.
"""

import json
import logging
from typing import Dict, List, Optional

import httpx

logger = logging.getLogger(__name__)

TIMEOUT = 120.0

# Pricing per 1M tokens (grok-4-1-fast)
PRICING = {
    "grok-4-1-fast": {"input": 0.20, "output": 0.50},
    "grok-code-fast-1": {"input": 0.20, "output": 1.50},
}


class GrokAPIClient:
    """Handles HTTP communication with the xAI API."""

    def __init__(self, api_key: str, model: str = "grok-4-1-fast"):
        self.api_key = api_key
        self.model = model
        self.base_url = "https://api.x.ai/v1"

    async def call(
        self,
        messages: List[Dict],
        response_schema: Optional[Dict] = None,
        max_tokens: int = 4096,
    ) -> tuple:
        """
        Call the xAI chat completions API.
        Returns (parsed_content, usage_dict).
        """
        body = {
            "model": self.model,
            "messages": messages,
            "max_completion_tokens": max_tokens,
            "temperature": 0.3,
        }
        if response_schema:
            body["response_format"] = {
                "type": "json_schema",
                "json_schema": response_schema,
            }

        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            resp = await client.post(
                f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json=body,
            )
            resp.raise_for_status()
            data = resp.json()

        content = data["choices"][0]["message"]["content"]
        usage = data.get("usage", {})

        if response_schema:
            parsed = json.loads(content)
        else:
            parsed = {"text": content}

        return parsed, usage

    def calculate_cost(self, usage: Dict) -> float:
        """Calculate USD cost from a usage dict."""
        prices = PRICING.get(self.model, PRICING["grok-4-1-fast"])
        prompt = usage.get("prompt_tokens", 0)
        completion = usage.get("completion_tokens", 0)
        return (prompt * prices["input"] + completion * prices["output"]) / 1_000_000
