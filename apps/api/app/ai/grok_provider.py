"""
Grok AI Provider - xAI API Integration

Uses the xAI chat completions API (OpenAI-compatible) at https://api.x.ai/v1.
Authentication: Bearer token via XAI_API_KEY environment variable.
Structured outputs via response_format with json_schema.

Models:
  - grok-4-1-fast: Fast reasoning ($0.20/1M in, $0.50/1M out, 2M context)
  - grok-code-fast-1: Optimized for coding ($0.20/1M in, $1.50/1M out)
"""

import json
import logging
from typing import Dict, List

import httpx

from app.ai.provider import (
    AIProvider,
    FileChange,
    GeneratedPatch,
    GeneratedPlan,
    PlanStep,
    RepoSummary,
    ValidationAnalysis,
    ValidationResult,
)

logger = logging.getLogger(__name__)

TIMEOUT = 120.0


class GrokProvider(AIProvider):
    """Real xAI/Grok API provider."""

    def __init__(self, api_key: str, model: str = "grok-4-1-fast"):
        self.api_key = api_key
        self.base_url = "https://api.x.ai/v1"
        self.model = model

    async def _call(
        self,
        messages: list,
        response_schema: dict = None,
        max_tokens: int = 4096,
    ) -> dict:
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
            logger.info(
                "Grok API call: %d prompt + %d completion tokens",
                usage.get("prompt_tokens", 0),
                usage.get("completion_tokens", 0),
            )
            if response_schema:
                return json.loads(content)
            return {"text": content}

    async def summarize_repo(
        self, file_tree: List[str], sample_files: Dict[str, str]
    ) -> RepoSummary:
        file_list = "\n".join(file_tree[:100])
        samples = ""
        for path, content in list(sample_files.items())[:10]:
            samples += f"\n--- {path} ---\n{content[:500]}\n"

        result = await self._call(
            messages=[
                {
                    "role": "system",
                    "content": "You are a senior software architect. Analyze the repository and return a structured summary.",
                },
                {
                    "role": "user",
                    "content": f"Analyze this repository.\n\nFile tree:\n{file_list}\n\nSample files:{samples}",
                },
            ],
            response_schema={
                "name": "repo_summary",
                "strict": True,
                "schema": {
                    "type": "object",
                    "properties": {
                        "description": {"type": "string"},
                        "tech_stack": {"type": "array", "items": {"type": "string"}},
                        "architecture": {"type": "string"},
                        "key_files": {"type": "array", "items": {"type": "string"}},
                    },
                    "required": ["description", "tech_stack", "architecture", "key_files"],
                    "additionalProperties": False,
                },
            },
        )
        return RepoSummary(
            description=result["description"],
            tech_stack=result["tech_stack"],
            architecture=result["architecture"],
            key_files=result["key_files"],
        )

    async def generate_plan(
        self, task: str, context: dict, constraints: List[str]
    ) -> GeneratedPlan:
        file_tree = "\n".join(context.get("file_tree", [])[:100])
        summary = context.get("summary", "")
        constraint_text = "\n".join(f"- {c}" for c in constraints) if constraints else "None"

        result = await self._call(
            messages=[
                {
                    "role": "system",
                    "content": "You are a senior software engineer. Create a detailed implementation plan for the given task.",
                },
                {
                    "role": "user",
                    "content": (
                        f"Task: {task}\n\n"
                        f"Repository summary: {summary}\n\n"
                        f"File tree:\n{file_tree}\n\n"
                        f"Constraints:\n{constraint_text}\n\n"
                        "Create a step-by-step plan."
                    ),
                },
            ],
            response_schema={
                "name": "plan",
                "strict": True,
                "schema": {
                    "type": "object",
                    "properties": {
                        "goal": {"type": "string"},
                        "steps": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "order": {"type": "integer"},
                                    "description": {"type": "string"},
                                    "affected_files": {
                                        "type": "array",
                                        "items": {"type": "string"},
                                    },
                                },
                                "required": ["order", "description", "affected_files"],
                                "additionalProperties": False,
                            },
                        },
                        "affected_files": {"type": "array", "items": {"type": "string"}},
                        "risks": {"type": "array", "items": {"type": "string"}},
                        "validation_checklist": {"type": "array", "items": {"type": "string"}},
                    },
                    "required": ["goal", "steps", "affected_files", "risks", "validation_checklist"],
                    "additionalProperties": False,
                },
            },
            max_tokens=2048,
        )
        return GeneratedPlan(
            goal=result["goal"],
            steps=[
                PlanStep(
                    order=s["order"],
                    description=s["description"],
                    affected_files=s["affected_files"],
                )
                for s in result["steps"]
            ],
            affected_files=result["affected_files"],
            risks=result["risks"],
            validation_checklist=result["validation_checklist"],
        )

    async def propose_patch(
        self, plan: dict, file_contents: Dict[str, str]
    ) -> GeneratedPatch:
        plan_text = json.dumps(plan, indent=2)
        files_text = ""
        for path, content in list(file_contents.items())[:10]:
            files_text += f"\n--- {path} ---\n{content}\n"

        result = await self._call(
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a senior software engineer. Generate code changes "
                        "following the plan. For each file, provide the complete original "
                        "and patched content, a unified diff, and a rationale."
                    ),
                },
                {
                    "role": "user",
                    "content": f"Plan:\n{plan_text}\n\nCurrent files:{files_text}\n\nGenerate patches.",
                },
            ],
            response_schema={
                "name": "patch",
                "strict": True,
                "schema": {
                    "type": "object",
                    "properties": {
                        "changes": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "file_path": {"type": "string"},
                                    "original_content": {"type": "string"},
                                    "patched_content": {"type": "string"},
                                    "diff": {"type": "string"},
                                    "rationale": {"type": "string"},
                                },
                                "required": [
                                    "file_path",
                                    "original_content",
                                    "patched_content",
                                    "diff",
                                    "rationale",
                                ],
                                "additionalProperties": False,
                            },
                        },
                        "overall_rationale": {"type": "string"},
                    },
                    "required": ["changes", "overall_rationale"],
                    "additionalProperties": False,
                },
            },
            max_tokens=8192,
        )
        return GeneratedPatch(
            changes=[
                FileChange(
                    file_path=c["file_path"],
                    original_content=c["original_content"],
                    patched_content=c["patched_content"],
                    diff=c["diff"],
                    rationale=c["rationale"],
                )
                for c in result["changes"]
            ],
            overall_rationale=result["overall_rationale"],
        )

    async def analyze_validation(self, result: ValidationResult) -> ValidationAnalysis:
        analysis = await self._call(
            messages=[
                {
                    "role": "system",
                    "content": "Analyze the validation output and determine if it passed or failed. Identify issues and suggest fixes.",
                },
                {
                    "role": "user",
                    "content": (
                        f"Command exit code: {result.exit_code}\n\n"
                        f"stdout:\n{result.stdout[:3000]}\n\n"
                        f"stderr:\n{result.stderr[:3000]}"
                    ),
                },
            ],
            response_schema={
                "name": "validation_analysis",
                "strict": True,
                "schema": {
                    "type": "object",
                    "properties": {
                        "passed": {"type": "boolean"},
                        "summary": {"type": "string"},
                        "issues": {"type": "array", "items": {"type": "string"}},
                        "suggested_fixes": {"type": "array", "items": {"type": "string"}},
                    },
                    "required": ["passed", "summary", "issues", "suggested_fixes"],
                    "additionalProperties": False,
                },
            },
            max_tokens=1024,
        )
        return ValidationAnalysis(
            passed=analysis["passed"],
            summary=analysis["summary"],
            issues=analysis["issues"],
            suggested_fixes=analysis["suggested_fixes"],
        )

    async def explain_diff(self, diff: str, file_path: str) -> str:
        result = await self._call(
            messages=[
                {
                    "role": "system",
                    "content": "Explain the following code diff in plain English. Be concise.",
                },
                {
                    "role": "user",
                    "content": f"File: {file_path}\n\nDiff:\n{diff}",
                },
            ],
            max_tokens=512,
        )
        return result["text"]
