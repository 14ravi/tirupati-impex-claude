import enum
import uuid
from datetime import datetime

from typing import Any

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class UserRole(enum.StrEnum):
    owner = "owner"
    admin = "admin"
    member = "member"


class Agency(Base):
    __tablename__ = "agencies"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(200))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    users: Mapped[list["User"]] = relationship(back_populates="agency")


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    agency_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("agencies.id", ondelete="CASCADE"), index=True)
    # Stored lowercase, so the unique constraint also stops case-only duplicates.
    email: Mapped[str] = mapped_column(String(320), unique=True)
    full_name: Mapped[str] = mapped_column(String(200))
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(Enum(UserRole, name="user_role"), default=UserRole.member)
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    agency: Mapped[Agency] = relationship(back_populates="users")


class RunStatus(enum.StrEnum):
    queued = "queued"
    running = "running"
    done = "done"
    failed = "failed"
    cancelled = "cancelled"


class WorkflowConfig(Base):
    """An agency's saved settings for one workflow: {section: {setting: value}}."""

    __tablename__ = "workflow_configs"
    __table_args__ = (UniqueConstraint("agency_id", "workflow_key"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    agency_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("agencies.id", ondelete="CASCADE"))
    workflow_key: Mapped[str] = mapped_column(String(50))
    params: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class WorkflowRun(Base):
    __tablename__ = "workflow_runs"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    agency_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("agencies.id", ondelete="CASCADE"), index=True)
    workflow_key: Mapped[str] = mapped_column(String(50))
    status: Mapped[RunStatus] = mapped_column(Enum(RunStatus, name="run_status"), default=RunStatus.queued)
    trigger: Mapped[str] = mapped_column(String(20))  # "manual" or "schedule"
    params: Mapped[dict[str, Any]] = mapped_column(JSONB)  # settings as they were when the run started
    created_by_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    leads_found: Mapped[int] = mapped_column(Integer, default=0)
    task_counts: Mapped[dict[str, int]] = mapped_column(JSONB, default=dict)  # items left after each task


class WorkflowSchedule(Base):
    """One schedule per workflow per agency. Times are in the schedule's time zone."""

    __tablename__ = "workflow_schedules"
    __table_args__ = (UniqueConstraint("agency_id", "workflow_key"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    agency_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("agencies.id", ondelete="CASCADE"))
    workflow_key: Mapped[str] = mapped_column(String(50))
    kind: Mapped[str] = mapped_column(String(10))  # "once", "daily" or "weekly"
    run_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))  # for "once"
    time_of_day: Mapped[str | None] = mapped_column(String(5))  # "HH:MM" for daily and weekly
    weekdays: Mapped[list[int]] = mapped_column(ARRAY(Integer), default=list)  # 0 = Monday
    timezone: Mapped[str] = mapped_column(String(50), default="Asia/Kolkata")
    next_run_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
