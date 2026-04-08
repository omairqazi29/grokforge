from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models import Base


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    repository_id: Mapped[int] = mapped_column(ForeignKey("repositories.id"))
    title: Mapped[str] = mapped_column(String(255))
    task_description: Mapped[str] = mapped_column(Text)
    constraints: Mapped[dict] = mapped_column(JSON, default=list)
    status: Mapped[str] = mapped_column(String(50), default="created")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    repository = relationship("Repository", back_populates="sessions")
    file_artifacts = relationship(
        "FileArtifact", back_populates="session", cascade="all, delete-orphan"
    )
    patch_artifacts = relationship(
        "PatchArtifact", back_populates="session", cascade="all, delete-orphan"
    )
    validation_runs = relationship(
        "ValidationRun", back_populates="session", cascade="all, delete-orphan"
    )
