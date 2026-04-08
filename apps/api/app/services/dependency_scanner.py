"""P1: Multi-file awareness — track cross-file dependencies via import analysis."""

import re
from pathlib import Path
from typing import Dict, List, Optional, Set


IMPORT_PATTERNS = [
    # Python: import x, from x import y
    re.compile(r"^(?:from\s+([\w.]+)\s+)?import\s+([\w.]+(?:\s*,\s*[\w.]+)*)"),
    # TypeScript/JS: import ... from 'x'
    re.compile(r"""import\s+.*?\s+from\s+['"](\.[\w/.]+)['"]"""),
    # TypeScript/JS: require('x')
    re.compile(r"""require\(['"](\.[\w/.]+)['"]\)"""),
]


class DependencyScanner:
    """Scan files for import statements to build a dependency graph."""

    def scan(self, root_path: str, file_tree: List[str]) -> Dict[str, List[str]]:
        """Returns {file: [files it imports]} for local imports only."""
        root = Path(root_path)
        graph: Dict[str, List[str]] = {}

        for filepath in file_tree:
            full_path = root / filepath
            if full_path.suffix not in {".py", ".ts", ".tsx", ".js", ".jsx"}:
                continue
            try:
                content = full_path.read_text(errors="ignore")
                deps = self._extract_imports(content, filepath, set(file_tree))
                if deps:
                    graph[filepath] = deps
            except OSError:
                pass

        return graph

    def get_affected_files(
        self, graph: Dict[str, List[str]], changed_files: List[str]
    ) -> List[str]:
        """Given changed files, find all files that depend on them (reverse deps)."""
        reverse: Dict[str, Set[str]] = {}
        for file, deps in graph.items():
            for dep in deps:
                reverse.setdefault(dep, set()).add(file)

        affected: Set[str] = set()
        queue = list(changed_files)
        while queue:
            current = queue.pop(0)
            for dependent in reverse.get(current, set()):
                if dependent not in affected and dependent not in changed_files:
                    affected.add(dependent)
                    queue.append(dependent)

        return sorted(affected)

    def _extract_imports(
        self, content: str, filepath: str, all_files: Set[str]
    ) -> List[str]:
        imports: List[str] = []
        file_dir = str(Path(filepath).parent)

        for line in content.splitlines():
            stripped = line.strip()
            for pattern in IMPORT_PATTERNS:
                match = pattern.match(stripped)
                if match:
                    groups = [g for g in match.groups() if g]
                    for group in groups:
                        resolved = self._resolve_import(group, file_dir, all_files)
                        if resolved:
                            imports.append(resolved)
        return imports

    def _resolve_import(
        self, import_path: str, file_dir: str, all_files: Set[str]
    ) -> Optional[str]:
        if import_path.startswith("."):
            # Relative import
            base = str(Path(file_dir) / import_path)
            for ext in ["", ".py", ".ts", ".tsx", ".js", ".jsx", "/index.ts", "/index.js"]:
                candidate = base + ext
                if candidate in all_files:
                    return candidate
        else:
            # Python absolute import
            module_path = import_path.replace(".", "/")
            for ext in [".py", "/__init__.py"]:
                candidate = module_path + ext
                if candidate in all_files:
                    return candidate
        return None
