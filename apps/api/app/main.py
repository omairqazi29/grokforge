from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.config import settings
from app.database import engine
from app.models import Base
from app.routers import repositories, sessions, plans, patches, validation


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(
    title="GrokForge API",
    description="Repo-aware coding workspace backend",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(repositories.router, prefix="/api/repos", tags=["repositories"])
app.include_router(sessions.router, prefix="/api/sessions", tags=["sessions"])
app.include_router(plans.router, prefix="/api/sessions", tags=["plans"])
app.include_router(patches.router, prefix="/api/sessions", tags=["patches"])
app.include_router(validation.router, prefix="/api/sessions", tags=["validation"])


@app.get("/api/health")
async def health():
    return {"status": "ok"}
