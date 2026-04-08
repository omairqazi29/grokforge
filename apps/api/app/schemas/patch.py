from datetime import datetime
from typing import List

from pydantic import BaseModel


class PatchFileChange(BaseModel):
    file_path: str
    original_content: str
    patched_content: str
    diff: str
    rationale: str


class PatchUpdate(BaseModel):
    status: str


class PatchResponse(BaseModel):
    id: int
    session_id: int
    changes: List[PatchFileChange]
    overall_rationale: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
