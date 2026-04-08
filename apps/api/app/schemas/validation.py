from datetime import datetime

from pydantic import BaseModel


class ValidationRunCreate(BaseModel):
    command: str
    patch_artifact_id: int


class ValidationRunResponse(BaseModel):
    id: int
    session_id: int
    patch_artifact_id: int
    command: str
    exit_code: int
    stdout: str
    stderr: str
    analysis: str
    duration_ms: int
    created_at: datetime

    model_config = {"from_attributes": True}
