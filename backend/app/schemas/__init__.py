import uuid
from datetime import date, datetime
from typing import Annotated, Any

from pydantic import BaseModel, BeforeValidator, ConfigDict


def empty_string_to_none(value: Any) -> Any:
    if value == "":
        return None
    return value


OptionalDate = Annotated[date | None, BeforeValidator(empty_string_to_none)]


class HealthResponse(BaseModel):
    status: str
    app_name: str
    app_env: str


class EngagementBase(BaseModel):
    name: str
    client_name: str | None = None
    description: str | None = None
    start_date: OptionalDate = None
    target_end_date: OptionalDate = None
    revised_end_date: OptionalDate = None
    actual_end_date: OptionalDate = None
    status: str = "Not Started"


class EngagementCreate(EngagementBase):
    pass


class EngagementUpdate(BaseModel):
    name: str | None = None
    client_name: str | None = None
    description: str | None = None
    start_date: OptionalDate = None
    target_end_date: OptionalDate = None
    revised_end_date: OptionalDate = None
    actual_end_date: OptionalDate = None
    status: str | None = None
    date_revision_reason: str | None = None


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
    start_date: OptionalDate = None
    target_completion_date: OptionalDate = None
    revised_completion_date: OptionalDate = None
    actual_completion_date: OptionalDate = None
    status: str = "Not Started"
    risks: str | None = None
    dependencies: str | None = None


class WorkstreamCreate(WorkstreamBase):
    pass


class WorkstreamUpdate(BaseModel):
    external_id: str | None = None
    name: str | None = None
    objective: str | None = None
    scope: str | None = None
    start_date: OptionalDate = None
    target_completion_date: OptionalDate = None
    revised_completion_date: OptionalDate = None
    actual_completion_date: OptionalDate = None
    status: str | None = None
    risks: str | None = None
    dependencies: str | None = None
    date_revision_reason: str | None = None


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
    start_date: OptionalDate = None
    target_completion_date: OptionalDate = None
    revised_completion_date: OptionalDate = None
    actual_completion_date: OptionalDate = None
    submission_date: OptionalDate = None
    approval_date: OptionalDate = None
    status: str = "Not Started"
    review_status: str | None = None


class DeliverableCreate(DeliverableBase):
    pass


class DeliverableUpdate(BaseModel):
    external_id: str | None = None
    name: str | None = None
    description: str | None = None
    deliverable_type: str | None = None
    start_date: OptionalDate = None
    target_completion_date: OptionalDate = None
    revised_completion_date: OptionalDate = None
    actual_completion_date: OptionalDate = None
    submission_date: OptionalDate = None
    approval_date: OptionalDate = None
    status: str | None = None
    review_status: str | None = None
    date_revision_reason: str | None = None


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
    start_date: OptionalDate = None
    target_completion_date: OptionalDate = None
    revised_completion_date: OptionalDate = None
    actual_completion_date: OptionalDate = None
    status: str = "Not Started"
    task_findings: str | None = None
    task_analysis: str | None = None
    evidence_summary: str | None = None


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    external_id: str | None = None
    title: str | None = None
    description: str | None = None
    priority: str | None = None
    start_date: OptionalDate = None
    target_completion_date: OptionalDate = None
    revised_completion_date: OptionalDate = None
    actual_completion_date: OptionalDate = None
    status: str | None = None
    task_findings: str | None = None
    task_analysis: str | None = None
    evidence_summary: str | None = None
    date_revision_reason: str | None = None


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
    start_date: OptionalDate = None
    target_completion_date: OptionalDate = None
    revised_completion_date: OptionalDate = None
    actual_completion_date: OptionalDate = None
    status: str = "Not Started"
    findings: str | None = None
    analysis: str | None = None


class SubtaskCreate(SubtaskBase):
    pass


class SubtaskUpdate(BaseModel):
    external_id: str | None = None
    title: str | None = None
    description: str | None = None
    completion_criteria: str | None = None
    priority: str | None = None
    start_date: OptionalDate = None
    target_completion_date: OptionalDate = None
    revised_completion_date: OptionalDate = None
    actual_completion_date: OptionalDate = None
    status: str | None = None
    findings: str | None = None
    analysis: str | None = None
    date_revision_reason: str | None = None


class SubtaskRead(SubtaskBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DateRevisionHistoryRead(BaseModel):
    id: uuid.UUID
    parent_type: str
    parent_id: uuid.UUID
    original_date: date | None
    previous_revised_date: date | None
    new_revised_date: date | None
    reason: str
    revised_by: uuid.UUID | None
    revised_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DashboardSummary(BaseModel):
    engagements: int
    workstreams: int
    deliverables: int
    tasks: int
    subtasks: int