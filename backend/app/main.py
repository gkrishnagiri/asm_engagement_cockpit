import uuid
from datetime import date
from decimal import Decimal
from typing import Annotated, Any

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import create_database_tables, get_db
from app.models import (
    DateRevisionHistory,
    Deliverable,
    Engagement,
    Subtask,
    Task,
    Workstream,
)
from app.schemas import (
    DashboardSummary,
    DateRevisionHistoryRead,
    DeliverableCreate,
    DeliverableRead,
    DeliverableUpdate,
    EngagementCreate,
    EngagementRead,
    EngagementUpdate,
    HealthResponse,
    SubtaskCreate,
    SubtaskRead,
    SubtaskUpdate,
    TaskCreate,
    TaskRead,
    TaskUpdate,
    WorkstreamCreate,
    WorkstreamRead,
    WorkstreamUpdate,
)

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


COMPLETED_STATUS = "Completed"


@app.on_event("startup")
def on_startup() -> None:
    create_database_tables()


@app.get("/api/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        app_name=settings.app_name,
        app_env=settings.app_env,
    )


def is_completed(status: str | None) -> bool:
    return (status or "").strip().lower() == COMPLETED_STATUS.lower()


def calculate_completed_ratio(items: list[Any]) -> Decimal:
    if not items:
        return Decimal("0.00")

    completed_count = sum(1 for item in items if is_completed(item.status))
    progress = Decimal(completed_count * 100) / Decimal(len(items))
    return progress.quantize(Decimal("0.01"))


def add_date_revision_history(
    db: Session,
    *,
    parent_type: str,
    parent_id: uuid.UUID,
    original_date: date | None,
    previous_revised_date: date | None,
    new_revised_date: date | None,
    reason: str | None,
) -> None:
    history = DateRevisionHistory(
        parent_type=parent_type,
        parent_id=parent_id,
        original_date=original_date,
        previous_revised_date=previous_revised_date,
        new_revised_date=new_revised_date,
        reason=reason or "No reason provided",
    )
    db.add(history)


def update_model_from_payload(
    db: Session,
    *,
    item: Any,
    payload: Any,
    parent_type: str,
    target_date_field: str,
    revised_date_field: str,
) -> None:
    data = payload.model_dump(exclude_unset=True)
    reason = data.pop("date_revision_reason", None)

    if revised_date_field in data:
        previous_revised_date = getattr(item, revised_date_field)
        new_revised_date = data[revised_date_field]

        if previous_revised_date != new_revised_date:
            add_date_revision_history(
                db,
                parent_type=parent_type,
                parent_id=item.id,
                original_date=getattr(item, target_date_field),
                previous_revised_date=previous_revised_date,
                new_revised_date=new_revised_date,
                reason=reason,
            )

    for field_name, value in data.items():
        setattr(item, field_name, value)


def validate_completion_rules(db: Session, item: Any, item_type: str) -> None:
    if not is_completed(getattr(item, "status", None)):
        return

    if item_type == "engagement":
        workstreams = list(db.scalars(select(Workstream).where(Workstream.engagement_id == item.id)).all())
        incomplete = [child for child in workstreams if not is_completed(child.status)]
        if incomplete:
            raise HTTPException(
                status_code=400,
                detail="Engagement cannot be completed until all workstreams are completed.",
            )

    if item_type == "workstream":
        deliverables = list(db.scalars(select(Deliverable).where(Deliverable.workstream_id == item.id)).all())
        incomplete = [child for child in deliverables if not is_completed(child.status)]
        if incomplete:
            raise HTTPException(
                status_code=400,
                detail="Workstream cannot be completed until all deliverables are completed.",
            )

    if item_type == "deliverable":
        tasks = list(db.scalars(select(Task).where(Task.deliverable_id == item.id)).all())
        incomplete = [child for child in tasks if not is_completed(child.status)]
        if incomplete:
            raise HTTPException(
                status_code=400,
                detail="Deliverable cannot be completed until all tasks are completed.",
            )

    if item_type == "task":
        subtasks = list(db.scalars(select(Subtask).where(Subtask.task_id == item.id)).all())
        incomplete = [child for child in subtasks if not is_completed(child.status)]
        if incomplete:
            raise HTTPException(
                status_code=400,
                detail="Task cannot be completed until all sub-tasks are completed.",
            )


def recalculate_task_progress(db: Session, task_id: uuid.UUID) -> None:
    task = db.get(Task, task_id)
    if task is None:
        return

    subtasks = list(db.scalars(select(Subtask).where(Subtask.task_id == task.id)).all())
    task.progress_percent = calculate_completed_ratio(subtasks)


def recalculate_deliverable_progress(db: Session, deliverable_id: uuid.UUID) -> None:
    deliverable = db.get(Deliverable, deliverable_id)
    if deliverable is None:
        return

    tasks = list(db.scalars(select(Task).where(Task.deliverable_id == deliverable.id)).all())
    deliverable.progress_percent = calculate_completed_ratio(tasks)


def recalculate_workstream_progress(db: Session, workstream_id: uuid.UUID) -> None:
    workstream = db.get(Workstream, workstream_id)
    if workstream is None:
        return

    deliverables = list(db.scalars(select(Deliverable).where(Deliverable.workstream_id == workstream.id)).all())
    workstream.progress_percent = calculate_completed_ratio(deliverables)


def recalculate_engagement_progress(db: Session, engagement_id: uuid.UUID) -> None:
    engagement = db.get(Engagement, engagement_id)
    if engagement is None:
        return

    workstreams = list(db.scalars(select(Workstream).where(Workstream.engagement_id == engagement.id)).all())
    engagement.progress_percent = calculate_completed_ratio(workstreams)


def recalculate_from_subtask(db: Session, subtask: Subtask) -> None:
    task = db.get(Task, subtask.task_id)
    if task is None:
        return

    recalculate_task_progress(db, task.id)

    deliverable = db.get(Deliverable, task.deliverable_id)
    if deliverable is None:
        return

    recalculate_deliverable_progress(db, deliverable.id)

    workstream = db.get(Workstream, deliverable.workstream_id)
    if workstream is None:
        return

    recalculate_workstream_progress(db, workstream.id)
    recalculate_engagement_progress(db, workstream.engagement_id)


def recalculate_from_task(db: Session, task: Task) -> None:
    recalculate_task_progress(db, task.id)

    deliverable = db.get(Deliverable, task.deliverable_id)
    if deliverable is None:
        return

    recalculate_deliverable_progress(db, deliverable.id)

    workstream = db.get(Workstream, deliverable.workstream_id)
    if workstream is None:
        return

    recalculate_workstream_progress(db, workstream.id)
    recalculate_engagement_progress(db, workstream.engagement_id)


def recalculate_from_deliverable(db: Session, deliverable: Deliverable) -> None:
    recalculate_deliverable_progress(db, deliverable.id)

    workstream = db.get(Workstream, deliverable.workstream_id)
    if workstream is None:
        return

    recalculate_workstream_progress(db, workstream.id)
    recalculate_engagement_progress(db, workstream.engagement_id)


def recalculate_from_workstream(db: Session, workstream: Workstream) -> None:
    recalculate_workstream_progress(db, workstream.id)
    recalculate_engagement_progress(db, workstream.engagement_id)


@app.get("/api/dashboard/summary", response_model=DashboardSummary)
def dashboard_summary(db: Annotated[Session, Depends(get_db)]) -> DashboardSummary:
    return DashboardSummary(
        engagements=db.scalar(select(func.count()).select_from(Engagement)) or 0,
        workstreams=db.scalar(select(func.count()).select_from(Workstream)) or 0,
        deliverables=db.scalar(select(func.count()).select_from(Deliverable)) or 0,
        tasks=db.scalar(select(func.count()).select_from(Task)) or 0,
        subtasks=db.scalar(select(func.count()).select_from(Subtask)) or 0,
    )


@app.get("/api/date-revision-history", response_model=list[DateRevisionHistoryRead])
def list_date_revision_history(
    db: Annotated[Session, Depends(get_db)],
    parent_type: str | None = Query(default=None),
    parent_id: uuid.UUID | None = Query(default=None),
) -> list[DateRevisionHistory]:
    statement = select(DateRevisionHistory).order_by(DateRevisionHistory.revised_at.desc())

    if parent_type is not None:
        statement = statement.where(DateRevisionHistory.parent_type == parent_type)

    if parent_id is not None:
        statement = statement.where(DateRevisionHistory.parent_id == parent_id)

    return list(db.scalars(statement).all())


@app.post("/api/engagements", response_model=EngagementRead)
def create_engagement(payload: EngagementCreate, db: Annotated[Session, Depends(get_db)]) -> Engagement:
    item = Engagement(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@app.get("/api/engagements", response_model=list[EngagementRead])
def list_engagements(db: Annotated[Session, Depends(get_db)]) -> list[Engagement]:
    return list(db.scalars(select(Engagement).order_by(Engagement.created_at.desc())).all())


@app.get("/api/engagements/{engagement_id}", response_model=EngagementRead)
def get_engagement(engagement_id: uuid.UUID, db: Annotated[Session, Depends(get_db)]) -> Engagement:
    item = db.get(Engagement, engagement_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Engagement not found")
    return item


@app.put("/api/engagements/{engagement_id}", response_model=EngagementRead)
def update_engagement(
    engagement_id: uuid.UUID,
    payload: EngagementUpdate,
    db: Annotated[Session, Depends(get_db)],
) -> Engagement:
    item = db.get(Engagement, engagement_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Engagement not found")

    update_model_from_payload(
        db,
        item=item,
        payload=payload,
        parent_type="engagement",
        target_date_field="target_end_date",
        revised_date_field="revised_end_date",
    )
    validate_completion_rules(db, item, "engagement")

    db.commit()
    db.refresh(item)
    return item


@app.post("/api/workstreams", response_model=WorkstreamRead)
def create_workstream(payload: WorkstreamCreate, db: Annotated[Session, Depends(get_db)]) -> Workstream:
    if db.get(Engagement, payload.engagement_id) is None:
        raise HTTPException(status_code=404, detail="Engagement not found")

    item = Workstream(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    recalculate_engagement_progress(db, item.engagement_id)
    db.commit()
    db.refresh(item)
    return item


@app.get("/api/workstreams", response_model=list[WorkstreamRead])
def list_workstreams(
    db: Annotated[Session, Depends(get_db)],
    engagement_id: uuid.UUID | None = Query(default=None),
) -> list[Workstream]:
    statement = select(Workstream).order_by(Workstream.created_at.desc())
    if engagement_id is not None:
        statement = (
            select(Workstream)
            .where(Workstream.engagement_id == engagement_id)
            .order_by(Workstream.created_at.desc())
        )
    return list(db.scalars(statement).all())


@app.get("/api/workstreams/{workstream_id}", response_model=WorkstreamRead)
def get_workstream(workstream_id: uuid.UUID, db: Annotated[Session, Depends(get_db)]) -> Workstream:
    item = db.get(Workstream, workstream_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Workstream not found")
    return item


@app.put("/api/workstreams/{workstream_id}", response_model=WorkstreamRead)
def update_workstream(
    workstream_id: uuid.UUID,
    payload: WorkstreamUpdate,
    db: Annotated[Session, Depends(get_db)],
) -> Workstream:
    item = db.get(Workstream, workstream_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Workstream not found")

    update_model_from_payload(
        db,
        item=item,
        payload=payload,
        parent_type="workstream",
        target_date_field="target_completion_date",
        revised_date_field="revised_completion_date",
    )
    validate_completion_rules(db, item, "workstream")
    recalculate_from_workstream(db, item)

    db.commit()
    db.refresh(item)
    return item


@app.post("/api/deliverables", response_model=DeliverableRead)
def create_deliverable(payload: DeliverableCreate, db: Annotated[Session, Depends(get_db)]) -> Deliverable:
    if db.get(Workstream, payload.workstream_id) is None:
        raise HTTPException(status_code=404, detail="Workstream not found")

    item = Deliverable(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    recalculate_from_deliverable(db, item)
    db.commit()
    db.refresh(item)
    return item


@app.get("/api/deliverables", response_model=list[DeliverableRead])
def list_deliverables(
    db: Annotated[Session, Depends(get_db)],
    workstream_id: uuid.UUID | None = Query(default=None),
) -> list[Deliverable]:
    statement = select(Deliverable).order_by(Deliverable.created_at.desc())
    if workstream_id is not None:
        statement = (
            select(Deliverable)
            .where(Deliverable.workstream_id == workstream_id)
            .order_by(Deliverable.created_at.desc())
        )
    return list(db.scalars(statement).all())


@app.get("/api/deliverables/{deliverable_id}", response_model=DeliverableRead)
def get_deliverable(deliverable_id: uuid.UUID, db: Annotated[Session, Depends(get_db)]) -> Deliverable:
    item = db.get(Deliverable, deliverable_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Deliverable not found")
    return item


@app.put("/api/deliverables/{deliverable_id}", response_model=DeliverableRead)
def update_deliverable(
    deliverable_id: uuid.UUID,
    payload: DeliverableUpdate,
    db: Annotated[Session, Depends(get_db)],
) -> Deliverable:
    item = db.get(Deliverable, deliverable_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Deliverable not found")

    update_model_from_payload(
        db,
        item=item,
        payload=payload,
        parent_type="deliverable",
        target_date_field="target_completion_date",
        revised_date_field="revised_completion_date",
    )
    validate_completion_rules(db, item, "deliverable")
    recalculate_from_deliverable(db, item)

    db.commit()
    db.refresh(item)
    return item


@app.post("/api/tasks", response_model=TaskRead)
def create_task(payload: TaskCreate, db: Annotated[Session, Depends(get_db)]) -> Task:
    if db.get(Deliverable, payload.deliverable_id) is None:
        raise HTTPException(status_code=404, detail="Deliverable not found")

    item = Task(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    recalculate_from_task(db, item)
    db.commit()
    db.refresh(item)
    return item


@app.get("/api/tasks", response_model=list[TaskRead])
def list_tasks(
    db: Annotated[Session, Depends(get_db)],
    deliverable_id: uuid.UUID | None = Query(default=None),
) -> list[Task]:
    statement = select(Task).order_by(Task.created_at.desc())
    if deliverable_id is not None:
        statement = select(Task).where(Task.deliverable_id == deliverable_id).order_by(Task.created_at.desc())
    return list(db.scalars(statement).all())


@app.get("/api/tasks/{task_id}", response_model=TaskRead)
def get_task(task_id: uuid.UUID, db: Annotated[Session, Depends(get_db)]) -> Task:
    item = db.get(Task, task_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return item


@app.put("/api/tasks/{task_id}", response_model=TaskRead)
def update_task(
    task_id: uuid.UUID,
    payload: TaskUpdate,
    db: Annotated[Session, Depends(get_db)],
) -> Task:
    item = db.get(Task, task_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Task not found")

    update_model_from_payload(
        db,
        item=item,
        payload=payload,
        parent_type="task",
        target_date_field="target_completion_date",
        revised_date_field="revised_completion_date",
    )
    validate_completion_rules(db, item, "task")
    recalculate_from_task(db, item)

    db.commit()
    db.refresh(item)
    return item


@app.post("/api/subtasks", response_model=SubtaskRead)
def create_subtask(payload: SubtaskCreate, db: Annotated[Session, Depends(get_db)]) -> Subtask:
    if db.get(Task, payload.task_id) is None:
        raise HTTPException(status_code=404, detail="Task not found")

    item = Subtask(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    recalculate_from_subtask(db, item)
    db.commit()
    db.refresh(item)
    return item


@app.get("/api/subtasks", response_model=list[SubtaskRead])
def list_subtasks(
    db: Annotated[Session, Depends(get_db)],
    task_id: uuid.UUID | None = Query(default=None),
) -> list[Subtask]:
    statement = select(Subtask).order_by(Subtask.created_at.desc())
    if task_id is not None:
        statement = select(Subtask).where(Subtask.task_id == task_id).order_by(Subtask.created_at.desc())
    return list(db.scalars(statement).all())


@app.get("/api/subtasks/{subtask_id}", response_model=SubtaskRead)
def get_subtask(subtask_id: uuid.UUID, db: Annotated[Session, Depends(get_db)]) -> Subtask:
    item = db.get(Subtask, subtask_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Sub-task not found")
    return item


@app.put("/api/subtasks/{subtask_id}", response_model=SubtaskRead)
def update_subtask(
    subtask_id: uuid.UUID,
    payload: SubtaskUpdate,
    db: Annotated[Session, Depends(get_db)],
) -> Subtask:
    item = db.get(Subtask, subtask_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Sub-task not found")

    update_model_from_payload(
        db,
        item=item,
        payload=payload,
        parent_type="subtask",
        target_date_field="target_completion_date",
        revised_date_field="revised_completion_date",
    )
    recalculate_from_subtask(db, item)

    db.commit()
    db.refresh(item)
    return item