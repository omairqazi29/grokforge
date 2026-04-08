from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.session import Session
from app.models.repository import Repository
from app.models.patch_artifact import PatchArtifact
from app.schemas import PatchResponse, PatchUpdate
from app.ai import get_ai_provider

router = APIRouter()


@router.post("/{session_id}/patch", response_model=PatchResponse, status_code=201)
async def generate_patch(session_id: int, db: AsyncSession = Depends(get_db)):
    session = await db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    repo = await db.get(Repository, session.repository_id)
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    result = await db.execute(
        select(PatchArtifact)
        .where(PatchArtifact.session_id == session_id)
        .order_by(PatchArtifact.created_at.desc())
        .limit(1)
    )
    existing_patch = result.scalar_one_or_none()
    if not existing_patch or not existing_patch.plan:
        raise HTTPException(status_code=400, detail="Generate a plan first")

    session.status = "patching"
    await db.commit()

    provider = get_ai_provider()
    patch = await provider.propose_patch(existing_patch.plan, {})

    existing_patch.changes = [
        {
            "file_path": c.file_path,
            "original_content": c.original_content,
            "patched_content": c.patched_content,
            "diff": c.diff,
            "rationale": c.rationale,
        }
        for c in patch.changes
    ]
    existing_patch.overall_rationale = patch.overall_rationale

    session.status = "reviewing"
    await db.commit()
    await db.refresh(existing_patch)
    return existing_patch


@router.patch("/{session_id}/patches/{patch_id}", response_model=PatchResponse)
async def update_patch_status(
    session_id: int,
    patch_id: int,
    body: PatchUpdate,
    db: AsyncSession = Depends(get_db),
):
    patch = await db.get(PatchArtifact, patch_id)
    if not patch or patch.session_id != session_id:
        raise HTTPException(status_code=404, detail="Patch not found")

    patch.status = body.status

    session = await db.get(Session, session_id)
    if body.status == "accepted":
        session.status = "completed"
    await db.commit()
    await db.refresh(patch)
    return patch
