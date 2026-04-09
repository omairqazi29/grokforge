"""
Grok AI Provider - xAI API Integration

Delegates HTTP transport to GrokAPIClient, schema definitions to schemas.py,
and usage tracking to TokenTracker. This module contains only domain logic:
building prompts, parsing responses, and mapping to domain objects.
"""

import json
import logging
from typing import Dict, List, Optional

from app.ai.grok_client import GrokAPIClient
from app.ai.provider import (
    AIProvider, FileChange, GeneratedPatch, GeneratedPlan,
    PlanStep, RepoSummary, ValidationAnalysis, ValidationResult,
)
from app.ai.schemas import (
    PATCH_SCHEMA, PLAN_SCHEMA, REPO_SUMMARY_SCHEMA, VALIDATION_ANALYSIS_SCHEMA,
)
from app.ai.token_tracker import TokenTracker

logger = logging.getLogger(__name__)


class GrokProvider(AIProvider):
    """Real xAI/Grok API provider."""

    def __init__(self, api_key: str, model: str = "grok-4-1-fast"):
        self.client = GrokAPIClient(api_key, model)
        self.tracker = TokenTracker(model)

    async def _invoke(
        self,
        operation: str,
        messages: List[Dict],
        response_schema: Optional[Dict] = None,
        max_tokens: int = 4096,
        session_id: Optional[int] = None,
    ) -> dict:
        """Call client, log, track usage, return parsed content."""
        parsed, usage = await self.client.call(messages, response_schema, max_tokens)
        cost = self.client.calculate_cost(usage)
        logger.info(
            "Grok API [%s]: %d prompt + %d completion tokens",
            operation, usage.get("prompt_tokens", 0), usage.get("completion_tokens", 0),
        )
        await self.tracker.record(operation, usage, cost, session_id)
        return parsed

    async def summarize_repo(
        self, file_tree: List[str], sample_files: Dict[str, str],
    ) -> RepoSummary:
        file_list = "\n".join(file_tree[:100])
        samples = "".join(
            f"\n--- {p} ---\n{c[:500]}\n" for p, c in list(sample_files.items())[:10]
        )
        result = await self._invoke(
            "summarize_repo",
            [
                {"role": "system", "content": "You are a senior software architect. Analyze the repository and return a structured summary."},
                {"role": "user", "content": f"Analyze this repository.\n\nFile tree:\n{file_list}\n\nSample files:{samples}"},
            ],
            response_schema=REPO_SUMMARY_SCHEMA,
        )
        return RepoSummary(**{k: result[k] for k in ("description", "tech_stack", "architecture", "key_files")})

    async def generate_plan(
        self, task: str, context: dict, constraints: List[str],
    ) -> GeneratedPlan:
        file_tree = "\n".join(context.get("file_tree", [])[:100])
        summary = context.get("summary", "")
        constraint_text = "\n".join(f"- {c}" for c in constraints) if constraints else "None"

        # Detect package manager / project type from file tree
        files = context.get("file_tree", [])
        checks = [
            ("requirements.txt", "Uses pip with requirements.txt (NOT poetry, NOT pyproject.toml for deps)"),
            ("pyproject.toml", "Has pyproject.toml"),
            ("package.json", "Uses npm/pnpm (check package.json)"),
            ("Cargo.toml", "Rust project with Cargo"),
            ("go.mod", "Go module"),
        ]
        pkg_hints = [hint for marker, hint in checks if any(marker in f for f in files)]
        pkg_context = "\n".join(f"- {h}" for h in pkg_hints) if pkg_hints else "Unknown"

        result = await self._invoke(
            "generate_plan",
            [
                {"role": "system", "content": (
                    "You are a senior software engineer. Create a detailed implementation plan. "
                    "IMPORTANT: Use only the package manager and tools that already exist in the repo. "
                    "Do NOT introduce new build systems (e.g., don't add poetry to a pip project). "
                    "Only modify files that already exist unless the task requires new files."
                )},
                {"role": "user", "content": (
                    f"Task: {task}\n\nRepository summary: {summary}\n\n"
                    f"Package manager / project type:\n{pkg_context}\n\n"
                    f"File tree:\n{file_tree}\n\nConstraints:\n{constraint_text}\n\n"
                    "Create a step-by-step plan."
                )},
            ],
            response_schema=PLAN_SCHEMA,
            max_tokens=2048,
        )
        return GeneratedPlan(
            goal=result["goal"],
            steps=[PlanStep(order=s["order"], description=s["description"],
                            affected_files=s["affected_files"]) for s in result["steps"]],
            affected_files=result["affected_files"],
            risks=result["risks"],
            validation_checklist=result["validation_checklist"],
        )

    async def propose_patch(
        self, plan: dict, file_contents: Dict[str, str],
    ) -> GeneratedPatch:
        plan_text = json.dumps(plan, indent=2)
        files_text = "".join(
            f"\n--- {p} ---\n{c}\n" for p, c in list(file_contents.items())[:10]
        )
        result = await self._invoke(
            "propose_patch",
            [
                {"role": "system", "content": (
                    "You are a senior software engineer. Generate code changes "
                    "following the plan. For each file, provide the complete original "
                    "and patched content, a unified diff, and a rationale."
                )},
                {"role": "user", "content": f"Plan:\n{plan_text}\n\nCurrent files:{files_text}\n\nGenerate patches."},
            ],
            response_schema=PATCH_SCHEMA,
            max_tokens=8192,
        )
        return GeneratedPatch(
            changes=[FileChange(**{k: ch[k] for k in ("file_path", "original_content",
                     "patched_content", "diff", "rationale")}) for ch in result["changes"]],
            overall_rationale=result["overall_rationale"],
        )

    async def analyze_validation(self, result: ValidationResult) -> ValidationAnalysis:
        analysis = await self._invoke(
            "analyze_validation",
            [
                {"role": "system", "content": "Analyze the validation output and determine if it passed or failed. Identify issues and suggest fixes."},
                {"role": "user", "content": (
                    f"Command exit code: {result.exit_code}\n\n"
                    f"stdout:\n{result.stdout[:3000]}\n\nstderr:\n{result.stderr[:3000]}"
                )},
            ],
            response_schema=VALIDATION_ANALYSIS_SCHEMA,
            max_tokens=1024,
        )
        return ValidationAnalysis(**{k: analysis[k] for k in ("passed", "summary", "issues", "suggested_fixes")})

    async def explain_diff(self, diff: str, file_path: str) -> str:
        result = await self._invoke(
            "explain_diff",
            [
                {"role": "system", "content": "Explain the following code diff in plain English. Be concise."},
                {"role": "user", "content": f"File: {file_path}\n\nDiff:\n{diff}"},
            ],
            max_tokens=512,
        )
        return result["text"]
