from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.repository import Repository
from app.schemas import RepositoryCreate, RepositoryResponse
from app.services.repo_scanner import RepoScanner
from app.ai import get_ai_provider

router = APIRouter()


@router.post("", response_model=RepositoryResponse, status_code=201)
async def create_repository(body: RepositoryCreate, db: AsyncSession = Depends(get_db)):
    scanner = RepoScanner()
    scan_result = scanner.scan(body.path)

    provider = get_ai_provider()
    summary = await provider.summarize_repo(scan_result.file_tree, scan_result.sample_files)

    repo = Repository(
        name=scan_result.name,
        path=body.path,
        file_tree=scan_result.file_tree,
        symbol_index=scan_result.symbol_index,
        summary=summary.description,
    )
    db.add(repo)
    await db.commit()
    await db.refresh(repo)
    return repo


@router.get("", response_model=List[RepositoryResponse])
async def list_repositories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Repository))
    return result.scalars().all()


@router.get("/{repo_id}", response_model=RepositoryResponse)
async def get_repository(repo_id: int, db: AsyncSession = Depends(get_db)):
    repo = await db.get(Repository, repo_id)
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    return repo
