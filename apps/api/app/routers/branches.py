"""Git branch management — list, create, checkout, current branch, recent commits."""

import asyncio
import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.repository import Repository

logger = logging.getLogger(__name__)
router = APIRouter()


class BranchInfo(BaseModel):
    name: str
    is_current: bool


class CommitInfo(BaseModel):
    sha: str
    message: str
    author: str
    date: str


class BranchCreateRequest(BaseModel):
    name: str
    from_branch: Optional[str] = None


class CheckoutRequest(BaseModel):
    branch: str


@router.get("/{repo_id}/branches", response_model=List[BranchInfo])
async def list_branches(repo_id: int, db: AsyncSession = Depends(get_db)):
    repo = await db.get(Repository, repo_id)
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    try:
        output = await _git(repo.path, "branch", "--no-color")
    except RuntimeError as e:
        logger.debug("Could not list branches (repo may not have commits): %s", e)
        return []

    branches = []
    for line in output.splitlines():
        line = line.strip()
        if not line:
            continue
        is_current = line.startswith("* ")
        name = line.lstrip("* ").strip()
        branches.append(BranchInfo(name=name, is_current=is_current))
    return branches


@router.get("/{repo_id}/branch/current")
async def get_current_branch(repo_id: int, db: AsyncSession = Depends(get_db)):
    repo = await db.get(Repository, repo_id)
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    try:
        branch = await _git(repo.path, "rev-parse", "--abbrev-ref", "HEAD")
        return {"branch": branch.strip()}
    except RuntimeError as e:
        logger.debug("Could not determine current branch: %s", e)
        return {"branch": None}


@router.post("/{repo_id}/branches", response_model=BranchInfo)
async def create_branch(
    repo_id: int, body: BranchCreateRequest, db: AsyncSession = Depends(get_db)
):
    repo = await db.get(Repository, repo_id)
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    try:
        try:
            await _git(repo.path, "stash", "--include-untracked")
        except RuntimeError as e:
            logger.debug("Nothing to stash: %s", e)
        if body.from_branch:
            await _git(repo.path, "checkout", body.from_branch)
        await _git(repo.path, "checkout", "-b", body.name)
        try:
            await _git(repo.path, "stash", "pop")
        except RuntimeError as e:
            logger.debug("Nothing to pop from stash: %s", e)
        return BranchInfo(name=body.name, is_current=True)
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{repo_id}/branch/checkout")
async def checkout_branch(
    repo_id: int, body: CheckoutRequest, db: AsyncSession = Depends(get_db)
):
    repo = await db.get(Repository, repo_id)
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    try:
        # Stash any dirty changes first
        try:
            await _git(repo.path, "stash", "--include-untracked")
        except RuntimeError as e:
            logger.debug("Nothing to stash: %s", e)
        await _git(repo.path, "checkout", body.branch)
        # Try to pop stash back
        try:
            await _git(repo.path, "stash", "pop")
        except RuntimeError as e:
            logger.debug("Nothing to pop from stash: %s", e)
        return {"branch": body.branch, "message": f"Switched to {body.branch}"}
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{repo_id}/commits", response_model=List[CommitInfo])
async def list_commits(
    repo_id: int, limit: int = 20, branch: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    repo = await db.get(Repository, repo_id)
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    try:
        args = ["log", f"--max-count={limit}", "--format=%H|%s|%an|%ai"]
        if branch:
            args.append(branch)
        output = await _git(repo.path, *args)
        commits = []
        for line in output.splitlines():
            parts = line.split("|", 3)
            if len(parts) == 4:
                commits.append(CommitInfo(
                    sha=parts[0][:8],
                    message=parts[1],
                    author=parts[2],
                    date=parts[3],
                ))
        return commits
    except RuntimeError as e:
        logger.debug("Could not list commits: %s", e)
        return []


async def _git(cwd: str, *args: str) -> str:
    proc = await asyncio.create_subprocess_exec(
        "git", *args, cwd=cwd,
        stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=30)
    if proc.returncode != 0:
        err = stderr.decode(errors="replace").strip()
        raise RuntimeError(err or f"git {args[0]} failed")
    return stdout.decode(errors="replace").strip()
