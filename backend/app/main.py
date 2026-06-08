import uuid
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import create_database_tables, get_db
from app.models import Deliverable, Engagement, Subtask, Task, Workstream
from app.schemas import (
    DashboardSummary,
    DeliverableCreate,
    DeliverableRead,
    EngagementCreate,
    EngagementRead,
    HealthResponse,
    SubtaskCreate,
    SubtaskRead,
    TaskCreate,
    TaskRead,
    WorkstreamCreate,
    WorkstreamRead,
)

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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


@app.get("/api/dashboard/summary", response_model=DashboardSummary)
def dashboard_summary(db: Annotated[Session, Depends(get_db)]) -> DashboardSummary:
    return DashboardSummary(
        engagements=db.scalar(select(func.count()).select_from(Engagement)) or 0,
        workstreams=db.scalar(select(func.count()).select_from(Workstream)) or 0,
        deliverables=db.scalar(select(func.count()).select_from(Deliverable)) or 0,
        tasks=db.scalar(select(func.count()).select_from(Task)) or 0,
        subtasks=db.scalar(select(func.count()).select_from(Subtask)) or 0,
    )


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


@app.post("/api/workstreams", response_model=WorkstreamRead)
def create_workstream(payload: WorkstreamCreate, db: Annotated[Session, Depends(get_db)]) -> Workstream:
    if db.get(Engagement, payload.engagement_id) is None:
        raise HTTPException(status_code=404, detail="Engagement not found")

    item = Workstream(**payload.model_dump())
    db.add(item)
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
        statement = select(Workstream).where(Workstream.engagement_id == engagement_id).order_by(Workstream.created_at.desc())
    return list(db.scalars(statement).all())


@app.get("/api/workstreams/{workstream_id}", response_model=WorkstreamRead)
def get_workstream(workstream_id: uuid.UUID, db: Annotated[Session, Depends(get_db)]) -> Workstream:
    item = db.get(Workstream, workstream_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Workstream not found")
    return item


@app.post("/api/deliverables", response_model=DeliverableRead)
def create_deliverable(payload: DeliverableCreate, db: Annotated[Session, Depends(get_db)]) -> Deliverable:
    if db.get(Workstream, payload.workstream_id) is None:
        raise HTTPException(status_code=404, detail="Workstream not found")

    item = Deliverable(**payload.model_dump())
    db.add(item)
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
        statement = select(Deliverable).where(Deliverable.workstream_id == workstream_id).order_by(Deliverable.created_at.desc())
    return list(db.scalars(statement).all())


@app.get("/api/deliverables/{deliverable_id}", response_model=DeliverableRead)
def get_deliverable(deliverable_id: uuid.UUID, db: Annotated[Session, Depends(get_db)]) -> Deliverable:
    item = db.get(Deliverable, deliverable_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Deliverable not found")
    return item


@app.post("/api/tasks", response_model=TaskRead)
def create_task(payload: TaskCreate, db: Annotated[Session, Depends(get_db)]) -> Task:
    if db.get(Deliverable, payload.deliverable_id) is None:
        raise HTTPException(status_code=404, detail="Deliverable not found")

    item = Task(**payload.model_dump())
    db.add(item)
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


@app.post("/api/subtasks", response_model=SubtaskRead)
def create_subtask(payload: SubtaskCreate, db: Annotated[Session, Depends(get_db)]) -> Subtask:
    if db.get(Task, payload.task_id) is None:
        raise HTTPException(status_code=404, detail="Task not found")

    item = Subtask(**payload.model_dump())
    db.add(item)
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