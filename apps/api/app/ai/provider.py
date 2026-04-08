from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Dict, List


@dataclass
class RepoSummary:
    description: str
    tech_stack: List[str] = field(default_factory=list)
    architecture: str = ""
    key_files: List[str] = field(default_factory=list)


@dataclass
class PlanStep:
    order: int
    description: str
    affected_files: List[str] = field(default_factory=list)


@dataclass
class GeneratedPlan:
    goal: str
    steps: List[PlanStep] = field(default_factory=list)
    affected_files: List[str] = field(default_factory=list)
    risks: List[str] = field(default_factory=list)
    validation_checklist: List[str] = field(default_factory=list)


@dataclass
class FileChange:
    file_path: str
    original_content: str
    patched_content: str
    diff: str
    rationale: str


@dataclass
class GeneratedPatch:
    changes: List[FileChange] = field(default_factory=list)
    overall_rationale: str = ""


@dataclass
class ValidationAnalysis:
    passed: bool = False
    summary: str = ""
    issues: List[str] = field(default_factory=list)
    suggested_fixes: List[str] = field(default_factory=list)


@dataclass
class ValidationResult:
    exit_code: int = 0
    stdout: str = ""
    stderr: str = ""
    duration_ms: int = 0


class AIProvider(ABC):
    @abstractmethod
    async def summarize_repo(
        self, file_tree: List[str], sample_files: Dict[str, str]
    ) -> RepoSummary:
        ...

    @abstractmethod
    async def generate_plan(
        self, task: str, context: dict, constraints: List[str]
    ) -> GeneratedPlan:
        ...

    @abstractmethod
    async def propose_patch(
        self, plan: dict, file_contents: Dict[str, str]
    ) -> GeneratedPatch:
        ...

    @abstractmethod
    async def analyze_validation(
        self, result: ValidationResult
    ) -> ValidationAnalysis:
        ...

    @abstractmethod
    async def explain_diff(self, diff: str, file_path: str) -> str:
        ...
