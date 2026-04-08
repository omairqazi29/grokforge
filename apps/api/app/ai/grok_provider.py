"""
Grok AI Provider - xAI API Integration

The xAI API is OpenAI-compatible at https://api.x.ai/v1.
Authentication: Bearer token via XAI_API_KEY environment variable.

Recommended models:
  - grok-4-1-fast: Fast, cost-efficient ($0.20/1M input, $0.50/1M output)
  - grok-code-fast-1: Optimized for agentic coding ($0.20/1M input, $1.50/1M output)

Supports:
  - Structured outputs (JSON schema in response_format)
  - Function calling / tool use
  - Files & Collections API for RAG
  - Multi-agent orchestration (beta)

Example request:
    POST https://api.x.ai/v1/chat/completions
    Authorization: Bearer $XAI_API_KEY
    {
        "model": "grok-4-1-fast",
        "messages": [{"role": "user", "content": "..."}],
        "response_format": {
            "type": "json_schema",
            "json_schema": { "name": "plan", "schema": { ... } }
        }
    }
"""

from typing import Dict, List

from app.ai.provider import (
    AIProvider,
    GeneratedPatch,
    GeneratedPlan,
    RepoSummary,
    ValidationAnalysis,
    ValidationResult,
)


class GrokProvider(AIProvider):
    """Real xAI/Grok API provider. Requires XAI_API_KEY to be set."""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.x.ai/v1"
        self.model = "grok-4-1-fast"

    async def summarize_repo(
        self, file_tree: List[str], sample_files: Dict[str, str]
    ) -> RepoSummary:
        raise NotImplementedError(
            "GrokProvider.summarize_repo not yet implemented. "
            "Set XAI_API_KEY='' to use MockProvider."
        )

    async def generate_plan(
        self, task: str, context: dict, constraints: List[str]
    ) -> GeneratedPlan:
        raise NotImplementedError(
            "GrokProvider.generate_plan not yet implemented. "
            "Set XAI_API_KEY='' to use MockProvider."
        )

    async def propose_patch(
        self, plan: dict, file_contents: Dict[str, str]
    ) -> GeneratedPatch:
        raise NotImplementedError(
            "GrokProvider.propose_patch not yet implemented. "
            "Set XAI_API_KEY='' to use MockProvider."
        )

    async def analyze_validation(
        self, result: ValidationResult
    ) -> ValidationAnalysis:
        raise NotImplementedError(
            "GrokProvider.analyze_validation not yet implemented. "
            "Set XAI_API_KEY='' to use MockProvider."
        )

    async def explain_diff(self, diff: str, file_path: str) -> str:
        raise NotImplementedError(
            "GrokProvider.explain_diff not yet implemented. "
            "Set XAI_API_KEY='' to use MockProvider."
        )
