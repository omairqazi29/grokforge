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
        operation: str = "unknown",
        response_schema: dict = None,
        max_tokens: int = 4096,
        session_id: int = None,
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
            prompt_tokens = usage.get("prompt_tokens", 0)
            completion_tokens = usage.get("completion_tokens", 0)
            total_tokens = usage.get("total_tokens", prompt_tokens + completion_tokens)

            logger.info(
                "Grok API [%s]: %d prompt + %d completion tokens",
                operation, prompt_tokens, completion_tokens,
            )

            # Track token usage in DB
            await self._record_usage(
                operation=operation,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                total_tokens=total_tokens,
                session_id=session_id,
            )

            if response_schema:
                return json.loads(content)
            return {"text": content}

    async def _record_usage(
        self,
        operation: str,
        prompt_tokens: int,
        completion_tokens: int,
        total_tokens: int,
        session_id: int = None,
    ):
        # Pricing for grok-4-1-fast: $0.20/1M input, $0.50/1M output
        cost = (prompt_tokens * 0.20 + completion_tokens * 0.50) / 1_000_000
        try:
            from app.database import async_session
            from app.models.token_usage import TokenUsage
            async with async_session() as db:
                record = TokenUsage(
                    session_id=session_id,
                    operation=operation,
                    model=self.model,
                    prompt_tokens=prompt_tokens,
                    completion_tokens=completion_tokens,
                    total_tokens=total_tokens,
                    cost_usd=cost,
                )
                db.add(record)
                await db.commit()
        except Exception as e:
            logger.warning("Failed to record token usage: %s", e)

    async def summarize_repo(
        self, file_tree: List[str], sample_files: Dict[str, str]
    ) -> RepoSummary:
        file_list = "\n".join(file_tree[:100])
        samples = ""
        for path, content in list(sample_files.items())[:10]:
            samples += f"\n--- {path} ---\n{content[:500]}\n"

        result = await self._call(
            operation="summarize_repo",
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

        # Detect package manager and project type from file tree
        files = context.get("file_tree", [])
        pkg_hints = []
        if any("requirements.txt" in f for f in files):
            pkg_hints.append("Uses pip with requirements.txt (NOT poetry, NOT pyproject.toml for deps)")
        if any("pyproject.toml" in f for f in files):
            pkg_hints.append("Has pyproject.toml")
        if any("package.json" in f for f in files):
            pkg_hints.append("Uses npm/pnpm (check package.json)")
        if any("Cargo.toml" in f for f in files):
            pkg_hints.append("Rust project with Cargo")
        if any("go.mod" in f for f in files):
            pkg_hints.append("Go module")
        pkg_context = "\n".join(f"- {h}" for h in pkg_hints) if pkg_hints else "Unknown"

        result = await self._call(
            operation="generate_plan",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a senior software engineer. Create a detailed implementation plan. "
                        "IMPORTANT: Use only the package manager and tools that already exist in the repo. "
                        "Do NOT introduce new build systems (e.g., don't add poetry to a pip project). "
                        "Only modify files that already exist unless the task requires new files."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        f"Task: {task}\n\n"
                        f"Repository summary: {summary}\n\n"
                        f"Package manager / project type:\n{pkg_context}\n\n"
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
            operation="propose_patch",
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
            operation="analyze_validation",
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
            operation="explain_diff",
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
