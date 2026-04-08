from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class SessionCreate(BaseModel):
    repository_id: int
    title: str
    task_description: str
    constraints: Optional[List[str]] = None


class SessionUpdate(BaseModel):
    status: Optional[str] = None
    title: Optional[str] = None


class SessionResponse(BaseModel):
    id: int
    repository_id: int
    title: str
    task_description: str
    constraints: List[str]
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
