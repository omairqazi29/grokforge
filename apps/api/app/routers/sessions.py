from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.session import Session
from app.schemas import SessionCreate, SessionResponse, SessionUpdate

router = APIRouter()


@router.post("", response_model=SessionResponse, status_code=201)
async def create_session(body: SessionCreate, db: AsyncSession = Depends(get_db)):
    session = Session(
        repository_id=body.repository_id,
        title=body.title,
        task_description=body.task_description,
        constraints=body.constraints or [],
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


@router.get("", response_model=List[SessionResponse])
async def list_sessions(
    repository_id: int = None, db: AsyncSession = Depends(get_db)
):
    query = select(Session)
    if repository_id:
        query = query.where(Session.repository_id == repository_id)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(session_id: int, db: AsyncSession = Depends(get_db)):
    session = await db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.patch("/{session_id}", response_model=SessionResponse)
async def update_session(
    session_id: int, body: SessionUpdate, db: AsyncSession = Depends(get_db)
):
    session = await db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if body.status:
        session.status = body.status
    if body.title:
        session.title = body.title
    await db.commit()
    await db.refresh(session)
    return session
