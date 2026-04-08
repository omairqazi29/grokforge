from datetime import datetime
from typing import List

from pydantic import BaseModel


class PlanStep(BaseModel):
    order: int
    description: str
    affected_files: List[str]


class PlanGenerate(BaseModel):
    pass


class PlanResponse(BaseModel):
    id: int
    session_id: int
    goal: str
    steps: List[PlanStep]
    affected_files: List[str]
    risks: List[str]
    validation_checklist: List[str]
    created_at: datetime

    model_config = {"from_attributes": True}
