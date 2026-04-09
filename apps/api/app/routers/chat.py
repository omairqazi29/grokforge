"""Grok chat — ask questions about a repo, session, or general coding help."""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.session import Session
from app.models.repository import Repository
from app.config import settings

router = APIRouter()


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    repo_id: Optional[int] = None
    session_id: Optional[int] = None


class ChatResponse(BaseModel):
    reply: str


@router.post("/api/chat", response_model=ChatResponse)
async def chat(body: ChatRequest, db: AsyncSession = Depends(get_db)):
    system_parts = [
        "You are a helpful coding assistant inside GrokForge, a repo-aware coding workspace. "
        "Answer questions about code, debugging, running commands, and software engineering. "
        "Be concise and practical."
    ]

    if body.repo_id:
        repo = await db.get(Repository, body.repo_id)
        if repo:
            system_parts.append(f"\nRepository: {repo.name} ({repo.path})")
            system_parts.append(f"Summary: {repo.summary}")
            system_parts.append(f"Files: {', '.join(repo.file_tree[:30])}")

    if body.session_id:
        session = await db.get(Session, body.session_id)
        if session:
            system_parts.append(f"\nActive session: {session.title}")
            system_parts.append(f"Task: {session.task_description}")

    messages = [{"role": "system", "content": "\n".join(system_parts)}]
    for msg in body.messages:
        messages.append({"role": msg.role, "content": msg.content})

    if not settings.xai_api_key:
        return ChatResponse(reply="Chat requires XAI_API_KEY to be set. Using mock provider.")

    from app.ai.grok_client import GrokAPIClient
    client = GrokAPIClient(api_key=settings.xai_api_key, model=settings.xai_model)
    parsed, usage = await client.call(messages, max_tokens=1024)

    # Track usage
    from app.ai.token_tracker import TokenTracker
    tracker = TokenTracker(model=settings.xai_model)
    cost = client.calculate_cost(usage)
    await tracker.record("chat", usage, cost)

    return ChatResponse(reply=parsed.get("text", ""))
