"""
JSON schema definitions for Grok structured outputs.

Design decision: Schemas are defined separately so they can be:
1. Versioned independently from provider logic
2. Tested against sample data
3. Reused across different AI providers
"""

REPO_SUMMARY_SCHEMA = {
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
}

PLAN_SCHEMA = {
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
                        "affected_files": {"type": "array", "items": {"type": "string"}},
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
}

PATCH_SCHEMA = {
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
                        "file_path", "original_content", "patched_content", "diff", "rationale",
                    ],
                    "additionalProperties": False,
                },
            },
            "overall_rationale": {"type": "string"},
        },
        "required": ["changes", "overall_rationale"],
        "additionalProperties": False,
    },
}

VALIDATION_ANALYSIS_SCHEMA = {
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
}
