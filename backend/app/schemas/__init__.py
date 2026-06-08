import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class HealthResponse(BaseModel):
    status: str
    app_name: str
    app_env: str


class EngagementBase(BaseModel):
    name: str
    client_name: str | None = None
    description: str | None = None
    start_date: date | None = None
    target_end_date: date | None = None
    revised_end_date: date | None = None
    actual_end_date: date | None = None
    status: str = "Not Started"


class EngagementCreate(EngagementBase):
    pass


class EngagementRead(EngagementBase):
    id: uuid.UUID
    progress_percent: float
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WorkstreamBase(BaseModel):
    engagement_id: uuid.UUID
    external_id: str | None = None
    name: str
    objective: str | None = None
    scope: str | None = None
    start_date: date | None = None
    target_completion_date: date | None = None
    revised_completion_date: date | None = None
    actual_completion_date: date | None = None
    status: str = "Not Started"
    risks: str | None = None
    dependencies: str | None = None


class WorkstreamCreate(WorkstreamBase):
    pass


class WorkstreamRead(WorkstreamBase):
    id: uuid.UUID
    progress_percent: float
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DeliverableBase(BaseModel):
    workstream_id: uuid.UUID
    external_id: str | None = None
    name: str
    description: str | None = None
    deliverable_type: str | None = None
    start_date: date | None = None
    target_completion_date: date | None = None
    revised_completion_date: date | None = None
    actual_completion_date: date | None = None
    submission_date: date | None = None
    approval_date: date | None = None
    status: str = "Not Started"
    review_status: str | None = None


class DeliverableCreate(DeliverableBase):
    pass


class DeliverableRead(DeliverableBase):
    id: uuid.UUID
    progress_percent: float
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TaskBase(BaseModel):
    deliverable_id: uuid.UUID
    external_id: str | None = None
    title: str
    description: str | None = None
    priority: str | None = None
    start_date: date | None = None
    target_completion_date: date | None = None
    revised_completion_date: date | None = None
    actual_completion_date: date | None = None
    status: str = "Not Started"
    task_findings: str | None = None
    task_analysis: str | None = None
    evidence_summary: str | None = None


class TaskCreate(TaskBase):
    pass


class TaskRead(TaskBase):
    id: uuid.UUID
    progress_percent: float
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SubtaskBase(BaseModel):
    task_id: uuid.UUID
    external_id: str | None = None
    title: str
    description: str | None = None
    completion_criteria: str | None = None
    priority: str | None = None
    start_date: date | None = None
    target_completion_date: date | None = None
    revised_completion_date: date | None = None
    actual_completion_date: date | None = None
    status: str = "Not Started"
    findings: str | None = None
    analysis: str | None = None


class SubtaskCreate(SubtaskBase):
    pass


class SubtaskRead(SubtaskBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DashboardSummary(BaseModel):
    engagements: int
    workstreams: int
    deliverables: int
    tasks: int
    subtasks: int