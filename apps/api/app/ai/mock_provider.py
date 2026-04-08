from typing import Dict, List

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


class MockProvider(AIProvider):
    """Returns realistic structured data without making any API calls."""

    async def summarize_repo(
        self, file_tree: List[str], sample_files: Dict[str, str]
    ) -> RepoSummary:
        tech_stack = []
        if any(f.endswith(".ts") or f.endswith(".tsx") for f in file_tree):
            tech_stack.append("TypeScript")
        if any(f.endswith(".py") for f in file_tree):
            tech_stack.append("Python")
        if any("package.json" in f for f in file_tree):
            tech_stack.append("Node.js")
        if any("requirements.txt" in f or "pyproject.toml" in f for f in file_tree):
            tech_stack.append("pip/Poetry")

        key_files = file_tree[:10]

        return RepoSummary(
            description=f"Repository with {len(file_tree)} files using {', '.join(tech_stack) or 'unknown stack'}.",
            tech_stack=tech_stack,
            architecture="Standard project structure with source files organized by module.",
            key_files=key_files,
        )

    async def generate_plan(
        self, task: str, context: dict, constraints: List[str]
    ) -> GeneratedPlan:
        file_tree = context.get("file_tree", [])
        affected = file_tree[:3] if file_tree else ["src/main.py"]

        return GeneratedPlan(
            goal=f"Implement: {task}",
            steps=[
                PlanStep(
                    order=1,
                    description="Analyze existing code structure and identify integration points",
                    affected_files=affected[:1],
                ),
                PlanStep(
                    order=2,
                    description="Implement the core changes required for the task",
                    affected_files=affected,
                ),
                PlanStep(
                    order=3,
                    description="Update tests to cover the new functionality",
                    affected_files=[f for f in file_tree if "test" in f.lower()][:2]
                    or ["tests/test_main.py"],
                ),
            ],
            affected_files=affected,
            risks=[
                "Changes may affect existing functionality in dependent modules",
                "New dependencies could increase bundle size",
            ],
            validation_checklist=[
                "Run existing test suite to check for regressions",
                "Verify the new feature works as expected",
                "Check for type errors and lint warnings",
            ],
        )

    async def propose_patch(
        self, plan: dict, file_contents: Dict[str, str]
    ) -> GeneratedPatch:
        affected = plan.get("affected_files", ["src/main.py"])
        changes = []

        for filepath in affected[:3]:
            original = file_contents.get(filepath, f"# Original content of {filepath}\n")
            patched = original + "\n# --- Changes applied by GrokForge ---\n# New implementation added here\n"
            diff = (
                f"--- a/{filepath}\n"
                f"+++ b/{filepath}\n"
                f"@@ -1,1 +1,3 @@\n"
                f" {original.splitlines()[0] if original.splitlines() else ''}\n"
                f"+# --- Changes applied by GrokForge ---\n"
                f"+# New implementation added here\n"
            )
            changes.append(
                FileChange(
                    file_path=filepath,
                    original_content=original,
                    patched_content=patched,
                    diff=diff,
                    rationale=f"Modified {filepath} to implement the requested changes as outlined in the plan.",
                )
            )

        return GeneratedPatch(
            changes=changes,
            overall_rationale=f"Applied changes to {len(changes)} file(s) following the generated plan. "
            "All modifications are minimal and focused on the task requirements.",
        )

    async def analyze_validation(self, result: ValidationResult) -> ValidationAnalysis:
        passed = result.exit_code == 0
        if passed:
            return ValidationAnalysis(
                passed=True,
                summary="All validation checks passed successfully.",
                issues=[],
                suggested_fixes=[],
            )
        return ValidationAnalysis(
            passed=False,
            summary=f"Validation failed with exit code {result.exit_code}.",
            issues=[
                line
                for line in result.stderr.splitlines()[:5]
                if line.strip()
            ] or ["Unknown error occurred"],
            suggested_fixes=[
                "Review the error output above",
                "Check that all dependencies are installed",
                "Verify the test configuration is correct",
            ],
        )

    async def explain_diff(self, diff: str, file_path: str) -> str:
        return (
            f"Changes to {file_path}: The diff shows modifications that implement "
            "the requested task. The changes are minimal and focused on the specific "
            "requirements without altering unrelated code."
        )
