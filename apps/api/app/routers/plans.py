from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.session import Session
from app.models.repository import Repository
from app.models.patch_artifact import PatchArtifact
from app.schemas import PlanResponse
from app.ai import get_ai_provider

router = APIRouter()


@router.post("/{session_id}/plan", response_model=PlanResponse, status_code=201)
async def generate_plan(session_id: int, db: AsyncSession = Depends(get_db)):
    session = await db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    repo = await db.get(Repository, session.repository_id)
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    session.status = "planning"
    await db.commit()

    provider = get_ai_provider()
    context = {
        "file_tree": repo.file_tree,
        "symbol_index": repo.symbol_index,
        "summary": repo.summary,
    }
    plan = await provider.generate_plan(
        session.task_description, context, session.constraints
    )

    patch_artifact = PatchArtifact(
        session_id=session_id,
        plan={
            "goal": plan.goal,
            "steps": [
                {
                    "order": s.order,
                    "description": s.description,
                    "affected_files": s.affected_files,
                }
                for s in plan.steps
            ],
            "affected_files": plan.affected_files,
            "risks": plan.risks,
            "validation_checklist": plan.validation_checklist,
        },
    )
    db.add(patch_artifact)

    session.status = "planned"
    await db.commit()
    await db.refresh(patch_artifact)

    return PlanResponse(
        id=patch_artifact.id,
        session_id=session_id,
        goal=plan.goal,
        steps=[
            {"order": s.order, "description": s.description, "affected_files": s.affected_files}
            for s in plan.steps
        ],
        affected_files=plan.affected_files,
        risks=plan.risks,
        validation_checklist=plan.validation_checklist,
        created_at=patch_artifact.created_at,
    )
