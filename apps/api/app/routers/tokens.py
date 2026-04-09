from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.token_usage import TokenUsage

router = APIRouter()


class TokenUsageResponse(BaseModel):
    id: int
    session_id: Optional[int] = None
    operation: str
    model: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    cost_usd: float
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenSummary(BaseModel):
    total_prompt_tokens: int
    total_completion_tokens: int
    total_tokens: int
    total_cost_usd: float
    request_count: int


@router.get("/api/tokens", response_model=List[TokenUsageResponse])
async def list_token_usage(
    session_id: Optional[int] = None, limit: int = 50, db: AsyncSession = Depends(get_db)
):
    query = select(TokenUsage).order_by(TokenUsage.created_at.desc()).limit(limit)
    if session_id is not None:
        query = query.where(TokenUsage.session_id == session_id)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/api/tokens/summary", response_model=TokenSummary)
async def get_token_summary(
    session_id: Optional[int] = None, db: AsyncSession = Depends(get_db)
):
    query = select(
        func.coalesce(func.sum(TokenUsage.prompt_tokens), 0).label("total_prompt_tokens"),
        func.coalesce(func.sum(TokenUsage.completion_tokens), 0).label("total_completion_tokens"),
        func.coalesce(func.sum(TokenUsage.total_tokens), 0).label("total_tokens"),
        func.coalesce(func.sum(TokenUsage.cost_usd), 0).label("total_cost_usd"),
        func.count(TokenUsage.id).label("request_count"),
    )
    if session_id is not None:
        query = query.where(TokenUsage.session_id == session_id)
    result = await db.execute(query)
    row = result.one()
    return TokenSummary(
        total_prompt_tokens=row.total_prompt_tokens,
        total_completion_tokens=row.total_completion_tokens,
        total_tokens=row.total_tokens,
        total_cost_usd=float(row.total_cost_usd),
        request_count=row.request_count,
    )
