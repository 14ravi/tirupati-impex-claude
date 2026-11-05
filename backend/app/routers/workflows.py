import uuid
from datetime import UTC, datetime, timedelta
from typing import Any, Literal
from zoneinfo import ZoneInfo

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import func, select

from app.deps import CurrentUser, DbSession
from app.models import RunStatus, User, WorkflowConfig, WorkflowRun, WorkflowSchedule
from app.scheduling import next_run, parse_time_of_day
from app.workflows import WORKFLOWS, Param, Workflow, validate

router = APIRouter(prefix="/api/workflows", tags=["workflows"])

TIMEZONE = "Asia/Kolkata"


class ParamOut(BaseModel):
    key: str
    label: str
    type: str
    help: str
    options: list[str]
    min: int | None
    max: int | None


class TaskOut(BaseModel):
    key: str
    name: str
    description: str
    params: list[ParamOut]


class RunOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    status: RunStatus
    trigger: str
    created_at: datetime
    leads_found: int
    task_counts: dict[str, int]


class ScheduleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    kind: str
    run_at: datetime | None
    time_of_day: str | None
    weekdays: list[int]
    timezone: str
    next_run_at: datetime | None


class WorkflowSummary(BaseModel):
    key: str
    name: str
    description: str
    available: bool
    tasks: list[str]
    last_run_at: datetime | None
    next_run_at: datetime | None


class WorkflowDetail(BaseModel):
    key: str
    name: str
    description: str
    run_params: list[ParamOut]
    tasks: list[TaskOut]
    values: dict[str, dict[str, Any]]
    schedule: ScheduleOut | None
    recent_runs: list[RunOut]
    runs_30d: int


class ParamsIn(BaseModel):
    values: dict[str, Any]


class ScheduleIn(BaseModel):
    kind: Literal["once", "daily", "weekly"]
    run_at: str | None = None  # local "YYYY-MM-DDTHH:MM" in the agency's time zone
    time_of_day: str | None = None
    weekdays: list[int] = []


def _params_out(params: tuple[Param, ...]) -> list[ParamOut]:
    return [ParamOut(key=p.key, label=p.label, type=p.type, help=p.help, options=list(p.options), min=p.min, max=p.max) for p in params]


def _parse_local(value: str) -> datetime:
    try:
        return datetime.fromisoformat(value).replace(tzinfo=ZoneInfo(TIMEZONE))
    except ValueError:
        raise ValueError("Choose a valid date and time.") from None


def _get_workflow(key: str) -> Workflow:
    workflow = WORKFLOWS.get(key)
    if workflow is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "That workflow doesn't exist.")
    if not workflow.available:
        raise HTTPException(status.HTTP_409_CONFLICT, f"{workflow.name} isn't available yet.")
    return workflow


def _values(db: DbSession, user: User, workflow: Workflow) -> dict[str, dict[str, Any]]:
    """Saved settings laid over the defaults, so settings added later still get a value."""
    config = db.scalar(
        select(WorkflowConfig).where(WorkflowConfig.agency_id == user.agency_id, WorkflowConfig.workflow_key == workflow.key)
    )
    values = workflow.defaults()
    for section, saved in (config.params if config else {}).items():
        if section in values:
            values[section].update({k: v for k, v in saved.items() if k in values[section]})
    return values


def _schedule(db: DbSession, user: User, key: str) -> WorkflowSchedule | None:
    return db.scalar(
        select(WorkflowSchedule).where(WorkflowSchedule.agency_id == user.agency_id, WorkflowSchedule.workflow_key == key)
    )


@router.get("")
def list_workflows(user: CurrentUser, db: DbSession) -> list[WorkflowSummary]:
    last_runs = dict(
        db.execute(
            select(WorkflowRun.workflow_key, func.max(WorkflowRun.created_at))
            .where(WorkflowRun.agency_id == user.agency_id)
            .group_by(WorkflowRun.workflow_key)
        ).all()
    )
    next_runs = dict(
        db.execute(
            select(WorkflowSchedule.workflow_key, WorkflowSchedule.next_run_at).where(WorkflowSchedule.agency_id == user.agency_id)
        ).all()
    )
    return [
        WorkflowSummary(
            key=w.key,
            name=w.name,
            description=w.description,
            available=w.available,
            tasks=[t.name for t in w.tasks],
            last_run_at=last_runs.get(w.key),
            next_run_at=next_runs.get(w.key),
        )
        for w in WORKFLOWS.values()
    ]


@router.get("/{key}")
def get_workflow(key: str, user: CurrentUser, db: DbSession) -> WorkflowDetail:
    workflow = _get_workflow(key)
    runs = db.scalars(
        select(WorkflowRun)
        .where(WorkflowRun.agency_id == user.agency_id, WorkflowRun.workflow_key == key)
        .order_by(WorkflowRun.created_at.desc())
        .limit(10)
    ).all()
    runs_30d = db.scalar(
        select(func.count())
        .select_from(WorkflowRun)
        .where(
            WorkflowRun.agency_id == user.agency_id,
            WorkflowRun.workflow_key == key,
            WorkflowRun.created_at >= datetime.now(UTC) - timedelta(days=30),
        )
    )
    schedule = _schedule(db, user, key)
    return WorkflowDetail(
        key=workflow.key,
        name=workflow.name,
        description=workflow.description,
        run_params=_params_out(workflow.run_params),
        tasks=[TaskOut(key=t.key, name=t.name, description=t.description, params=_params_out(t.params)) for t in workflow.tasks],
        values=_values(db, user, workflow),
        schedule=ScheduleOut.model_validate(schedule) if schedule else None,
        recent_runs=[RunOut.model_validate(r) for r in runs],
        runs_30d=runs_30d or 0,
    )


@router.put("/{key}/params/{section}")
def save_params(key: str, section: str, body: ParamsIn, user: CurrentUser, db: DbSession) -> dict[str, Any]:
    workflow = _get_workflow(key)
    sections = workflow.sections()
    if section not in sections:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "That task doesn't exist in this workflow.")
    try:
        clean = validate(sections[section], body.values)
    except ValueError as err:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, str(err)) from None

    config = db.scalar(
        select(WorkflowConfig).where(WorkflowConfig.agency_id == user.agency_id, WorkflowConfig.workflow_key == key)
    )
    if config is None:
        config = WorkflowConfig(agency_id=user.agency_id, workflow_key=key, params={})
        db.add(config)
    # Reassign rather than mutate, so SQLAlchemy sees the JSON change.
    config.params = {**config.params, section: {**config.params.get(section, {}), **clean}}
    db.commit()
    return _values(db, user, workflow)[section]


@router.post("/{key}/runs", status_code=status.HTTP_201_CREATED)
def start_run(key: str, user: CurrentUser, db: DbSession) -> RunOut:
    workflow = _get_workflow(key)
    run = WorkflowRun(
        agency_id=user.agency_id,
        workflow_key=key,
        status=RunStatus.queued,
        trigger="manual",
        params=_values(db, user, workflow),
        created_by_id=user.id,
        leads_found=0,
        task_counts={},
    )
    db.add(run)
    db.commit()
    db.refresh(run)
    return RunOut.model_validate(run)


@router.put("/{key}/schedule")
def save_schedule(key: str, body: ScheduleIn, user: CurrentUser, db: DbSession) -> ScheduleOut:
    _get_workflow(key)
    now = datetime.now(UTC)
    run_at = None
    time_of_day = None
    weekdays: list[int] = []
    try:
        if body.kind == "once":
            if not body.run_at:
                raise ValueError("Choose a date and time.")
            run_at = _parse_local(body.run_at)
            if run_at <= now:
                raise ValueError("Choose a time in the future.")
        else:
            parse_time_of_day(body.time_of_day or "")
            time_of_day = body.time_of_day
            if body.kind == "weekly":
                weekdays = sorted(set(body.weekdays))
                if not weekdays or any(d not in range(7) for d in weekdays):
                    raise ValueError("Choose at least one day.")
    except ValueError as err:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, str(err)) from None

    schedule = _schedule(db, user, key)
    if schedule is None:
        schedule = WorkflowSchedule(agency_id=user.agency_id, workflow_key=key, timezone=TIMEZONE)
        db.add(schedule)
    schedule.kind = body.kind
    schedule.run_at = run_at
    schedule.time_of_day = time_of_day
    schedule.weekdays = weekdays
    schedule.next_run_at = next_run(body.kind, tz=TIMEZONE, now=now, run_at=run_at, time_of_day=time_of_day, weekdays=weekdays)
    db.commit()
    return ScheduleOut.model_validate(schedule)


@router.delete("/{key}/schedule", status_code=status.HTTP_204_NO_CONTENT)
def delete_schedule(key: str, user: CurrentUser, db: DbSession) -> None:
    _get_workflow(key)
    schedule = _schedule(db, user, key)
    if schedule is not None:
        db.delete(schedule)
        db.commit()
