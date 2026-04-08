from datetime import datetime
from typing import Dict, List

from pydantic import BaseModel


class RepositoryCreate(BaseModel):
    path: str


class RepositoryResponse(BaseModel):
    id: int
    name: str
    path: str
    file_tree: List[str]
    symbol_index: Dict[str, List[str]]
    summary: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
