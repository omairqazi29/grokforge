from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models import Base


class PatchArtifact(Base):
    __tablename__ = "patch_artifacts"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("sessions.id"))
    plan: Mapped[dict] = mapped_column(JSON, default=dict)
    changes: Mapped[dict] = mapped_column(JSON, default=list)
    overall_rationale: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(50), default="pending")
    pr_branch: Mapped[str] = mapped_column(String(500), default="")
    pr_url: Mapped[str] = mapped_column(String(1024), default="")
    pr_commit_sha: Mapped[str] = mapped_column(String(50), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    session = relationship("Session", back_populates="patch_artifacts")
    validation_runs = relationship(
        "ValidationRun", back_populates="patch_artifact", cascade="all, delete-orphan"
    )
