import os

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.session import Session
from app.models.repository import Repository
from app.models.patch_artifact import PatchArtifact
from app.schemas import PatchResponse, PatchUpdate
from app.schemas.patch import PatchGenerate
from app.ai import get_ai_provider

router = APIRouter()


@router.get("/{session_id}/patches", response_model=list)
async def list_patches(session_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(PatchArtifact)
        .where(PatchArtifact.session_id == session_id)
        .order_by(PatchArtifact.created_at.desc())
    )
    patches = result.scalars().all()
    return [PatchResponse.model_validate(p) for p in patches]


@router.post("/{session_id}/patch", response_model=PatchResponse, status_code=201)
async def generate_patch(
    session_id: int, body: PatchGenerate = PatchGenerate(), db: AsyncSession = Depends(get_db)
):
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
    patch = await provider.propose_patch(existing_patch.plan, {}, feedback=body.feedback)

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
    existing_patch.status = "pending"

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

    session = await db.get(Session, session_id)
    repo = await db.get(Repository, session.repository_id)

    patch.status = body.status

    # When accepting, write patched files to disk
    if body.status == "accepted" and repo and patch.changes:
        for change in patch.changes:
            file_path = change.get("file_path", "")
            patched_content = change.get("patched_content", "")
            if file_path and patched_content:
                full_path = os.path.join(repo.path, file_path)
                os.makedirs(os.path.dirname(full_path), exist_ok=True)
                with open(full_path, "w") as f:
                    f.write(patched_content)

        session.status = "completed"
    elif body.status == "rejected":
        # Revert files to original content
        if repo and patch.changes:
            for change in patch.changes:
                file_path = change.get("file_path", "")
                original_content = change.get("original_content", "")
                if file_path and original_content:
                    full_path = os.path.join(repo.path, file_path)
                    if os.path.exists(full_path):
                        with open(full_path, "w") as f:
                            f.write(original_content)

    await db.commit()
    await db.refresh(patch)
    return patch
