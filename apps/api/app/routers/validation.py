from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.session import Session
from app.models.repository import Repository
from app.models.validation_run import ValidationRun
from app.schemas import ValidationRunCreate, ValidationRunResponse
from app.services.validation_runner import ValidationRunner
from app.ai import get_ai_provider

router = APIRouter()


@router.get("/{session_id}/validations", response_model=List[ValidationRunResponse])
async def list_validations(session_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ValidationRun)
        .where(ValidationRun.session_id == session_id)
        .order_by(ValidationRun.created_at.desc())
    )
    return result.scalars().all()


@router.post(
    "/{session_id}/validate", response_model=ValidationRunResponse, status_code=201
)
async def run_validation(
    session_id: int, body: ValidationRunCreate, db: AsyncSession = Depends(get_db)
):
    session = await db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    repo = await db.get(Repository, session.repository_id)
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    session.status = "validating"
    await db.commit()

    runner = ValidationRunner()
    result = await runner.run(body.command, repo.path)

    provider = get_ai_provider()
    analysis = await provider.analyze_validation(result)

    run = ValidationRun(
        session_id=session_id,
        patch_artifact_id=body.patch_artifact_id,
        command=body.command,
        exit_code=result.exit_code,
        stdout=result.stdout,
        stderr=result.stderr,
        analysis=analysis.summary,
        duration_ms=result.duration_ms,
    )
    db.add(run)

    session.status = "reviewing"
    await db.commit()
    await db.refresh(run)
    return run
