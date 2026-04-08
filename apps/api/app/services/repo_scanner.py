import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List


IGNORED_DIRS = {
    ".git", "node_modules", "dist", "build", "coverage", ".next",
    "venv", ".venv", "__pycache__", ".pytest_cache", ".turbo",
    ".egg-info", ".mypy_cache", ".ruff_cache",
}

IGNORED_EXTENSIONS = {
    ".pyc", ".pyo", ".so", ".dll", ".dylib", ".exe",
    ".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg",
    ".woff", ".woff2", ".ttf", ".eot",
    ".zip", ".tar", ".gz", ".bz2",
    ".db", ".sqlite", ".sqlite3",
}

MAX_FILES = 500
MAX_FILE_SIZE = 50_000  # 50KB
SAMPLE_FILE_COUNT = 20
SAMPLE_FILE_LINES = 100


@dataclass
class ScanResult:
    name: str
    file_tree: List[str] = field(default_factory=list)
    symbol_index: Dict[str, List[str]] = field(default_factory=dict)
    sample_files: Dict[str, str] = field(default_factory=dict)


class RepoScanner:
    def scan(self, repo_path: str) -> ScanResult:
        root = Path(repo_path).resolve()
        if not root.is_dir():
            raise ValueError(f"Not a valid directory: {repo_path}")

        result = ScanResult(name=root.name)
        file_count = 0

        for dirpath, dirnames, filenames in os.walk(root):
            dirnames[:] = [d for d in dirnames if d not in IGNORED_DIRS]

            for filename in sorted(filenames):
                if file_count >= MAX_FILES:
                    break

                filepath = Path(dirpath) / filename
                if filepath.suffix in IGNORED_EXTENSIONS:
                    continue

                relative = str(filepath.relative_to(root))
                result.file_tree.append(relative)
                file_count += 1

                if len(result.sample_files) < SAMPLE_FILE_COUNT:
                    try:
                        size = filepath.stat().st_size
                        if size <= MAX_FILE_SIZE:
                            lines = filepath.read_text(errors="ignore").splitlines()
                            result.sample_files[relative] = "\n".join(
                                lines[:SAMPLE_FILE_LINES]
                            )
                    except (OSError, UnicodeDecodeError):
                        pass

        result.symbol_index = self._extract_symbols(root, result.file_tree)
        return result

    def _extract_symbols(
        self, root: Path, file_tree: List[str]
    ) -> Dict[str, List[str]]:
        import re

        symbols: Dict[str, List[str]] = {}
        patterns = [
            re.compile(r"^(?:export\s+)?(?:async\s+)?function\s+(\w+)"),
            re.compile(r"^(?:export\s+)?class\s+(\w+)"),
            re.compile(r"^(?:export\s+)?(?:const|let|var)\s+(\w+)\s*="),
            re.compile(r"^def\s+(\w+)"),
            re.compile(r"^class\s+(\w+)"),
        ]

        for filepath in file_tree:
            full_path = root / filepath
            if full_path.suffix not in {".ts", ".tsx", ".js", ".jsx", ".py"}:
                continue

            try:
                content = full_path.read_text(errors="ignore")
                file_symbols = []
                for line in content.splitlines():
                    stripped = line.strip()
                    for pattern in patterns:
                        match = pattern.match(stripped)
                        if match:
                            file_symbols.append(match.group(1))
                            break
                if file_symbols:
                    symbols[filepath] = file_symbols
            except (OSError, UnicodeDecodeError):
                pass

        return symbols
