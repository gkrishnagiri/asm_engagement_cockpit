import shutil
import uuid
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from fastapi import Depends

from app.database import get_db
from app.models import DataPoint, StakeholderQuestion, Subtask
from app.models.mvp5_findings import AnalysisOutput, EvidenceItem, Finding
from app.models.mvp7_files import UploadedFile
from app.schemas.mvp6_refinement import TextRefinementRequest, TextRefinementResponse
from app.schemas.mvp7_files import UploadedFileRead

router = APIRouter(prefix="/api", tags=["MVP 6 Refinement and MVP 7 Files"])

PROJECT_ROOT = Path(__file__).resolve().parents[2]
UPLOAD_DIR = PROJECT_ROOT / "data" / "uploads"


def normalize_spacing(text: str) -> str:
    lines = [line.strip() for line in text.strip().splitlines()]
    lines = [line for line in lines if line]
    return "\n".join(lines)


def sentence_case(text: str) -> str:
    cleaned = normalize_spacing(text)
    if not cleaned:
        return cleaned

    if cleaned.endswith((".", "!", "?")):
        return cleaned

    return f"{cleaned}."


def refine_finding_text(raw_text: str) -> str:
    cleaned = sentence_case(raw_text)

    return (
        "Finding:\n"
        f"{cleaned}\n\n"
        "Business impact:\n"
        "This may affect the accuracy, completeness, or reliability of the consulting assessment if not validated.\n\n"
        "Recommendation:\n"
        "Validate the underlying source, confirm ownership and assumptions, and document the evidence before using this item in final deliverables.\n\n"
        "Confidence:\n"
        "Medium, pending source validation and stakeholder confirmation."
    )


def refine_analysis_text(raw_text: str) -> str:
    cleaned = sentence_case(raw_text)

    return (
        "Analysis summary:\n"
        f"{cleaned}\n\n"
        "Methodology:\n"
        "Review available data points, compare them against stakeholder inputs, identify patterns or gaps, and document assumptions.\n\n"
        "Assumptions:\n"
        "The available data reflects the current operational context unless further exceptions are identified.\n\n"
        "Limitations:\n"
        "This analysis should be treated as preliminary until supporting evidence and stakeholder confirmation are complete.\n\n"
        "Next step:\n"
        "Link relevant data points, stakeholder responses, and evidence items to support the analysis output."
    )


def refine_general_text(raw_text: str) -> str:
    cleaned = sentence_case(raw_text)

    return (
        "Refined note:\n"
        f"{cleaned}\n\n"
        "Suggested next step:\n"
        "Review, validate, and link this note to the appropriate consulting work item."
    )


def refine_text(payload: TextRefinementRequest) -> str:
    raw_text = payload.raw_text.strip()

    if not raw_text:
        raise HTTPException(status_code=400, detail="raw_text cannot be empty")

    refinement_type = payload.refinement_type.strip().lower()

    if refinement_type == "finding":
        return refine_finding_text(raw_text)

    if refinement_type == "analysis":
        return refine_analysis_text(raw_text)

    return refine_general_text(raw_text)


def ensure_upload_dir() -> None:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def validate_optional_reference(db: Session, model: object, item_id: uuid.UUID | None, label: str) -> None:
    if item_id is None:
        return

    if db.get(model, item_id) is None:
        raise HTTPException(status_code=404, detail=f"{label} not found")


def safe_filename(filename: str) -> str:
    cleaned = filename.replace("\\", "_").replace("/", "_").strip()
    if not cleaned:
        return "uploaded_file"
    return cleaned


@router.post("/refine-text", response_model=TextRefinementResponse)
def refine_text_endpoint(payload: TextRefinementRequest) -> TextRefinementResponse:
    refined_text = refine_text(payload)

    return TextRefinementResponse(
        raw_text=payload.raw_text,
        refined_text=refined_text,
        refinement_type=payload.refinement_type,
        tone=payload.tone,
        output_format=payload.output_format,
    )


@router.post("/uploaded-files", response_model=UploadedFileRead)
def upload_file(
    db: Annotated[Session, Depends(get_db)],
    file: UploadFile = File(...),
    description: str | None = Form(default=None),
    upload_category: str | None = Form(default=None),
    subtask_id: uuid.UUID | None = Form(default=None),
    data_point_id: uuid.UUID | None = Form(default=None),
    stakeholder_question_id: uuid.UUID | None = Form(default=None),
    finding_id: uuid.UUID | None = Form(default=None),
    analysis_output_id: uuid.UUID | None = Form(default=None),
    evidence_item_id: uuid.UUID | None = Form(default=None),
    uploaded_by: str | None = Form(default=None),
) -> UploadedFile:
    validate_optional_reference(db, Subtask, subtask_id, "Sub-task")
    validate_optional_reference(db, DataPoint, data_point_id, "Data point")
    validate_optional_reference(db, StakeholderQuestion, stakeholder_question_id, "Stakeholder question")
    validate_optional_reference(db, Finding, finding_id, "Finding")
    validate_optional_reference(db, AnalysisOutput, analysis_output_id, "Analysis output")
    validate_optional_reference(db, EvidenceItem, evidence_item_id, "Evidence item")

    ensure_upload_dir()

    original_filename = safe_filename(file.filename or "uploaded_file")
    stored_filename = f"{uuid.uuid4()}_{original_filename}"
    storage_path = UPLOAD_DIR / stored_filename

    with storage_path.open("wb") as destination:
        shutil.copyfileobj(file.file, destination)

    file_size_bytes = storage_path.stat().st_size

    uploaded_file = UploadedFile(
        original_filename=original_filename,
        stored_filename=stored_filename,
        storage_path=str(storage_path),
        content_type=file.content_type,
        file_size_bytes=file_size_bytes,
        description=description,
        upload_category=upload_category,
        subtask_id=subtask_id,
        data_point_id=data_point_id,
        stakeholder_question_id=stakeholder_question_id,
        finding_id=finding_id,
        analysis_output_id=analysis_output_id,
        evidence_item_id=evidence_item_id,
        uploaded_by=uploaded_by,
    )

    db.add(uploaded_file)
    db.commit()
    db.refresh(uploaded_file)

    return uploaded_file


@router.get("/uploaded-files", response_model=list[UploadedFileRead])
def list_uploaded_files(
    db: Annotated[Session, Depends(get_db)],
    subtask_id: uuid.UUID | None = Query(default=None),
    data_point_id: uuid.UUID | None = Query(default=None),
    stakeholder_question_id: uuid.UUID | None = Query(default=None),
    finding_id: uuid.UUID | None = Query(default=None),
    analysis_output_id: uuid.UUID | None = Query(default=None),
    evidence_item_id: uuid.UUID | None = Query(default=None),
) -> list[UploadedFile]:
    statement = select(UploadedFile).order_by(UploadedFile.created_at.desc())

    if subtask_id is not None:
        statement = statement.where(UploadedFile.subtask_id == subtask_id)

    if data_point_id is not None:
        statement = statement.where(UploadedFile.data_point_id == data_point_id)

    if stakeholder_question_id is not None:
        statement = statement.where(UploadedFile.stakeholder_question_id == stakeholder_question_id)

    if finding_id is not None:
        statement = statement.where(UploadedFile.finding_id == finding_id)

    if analysis_output_id is not None:
        statement = statement.where(UploadedFile.analysis_output_id == analysis_output_id)

    if evidence_item_id is not None:
        statement = statement.where(UploadedFile.evidence_item_id == evidence_item_id)

    return list(db.scalars(statement).all())


@router.get("/uploaded-files/{uploaded_file_id}", response_model=UploadedFileRead)
def get_uploaded_file(
    uploaded_file_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
) -> UploadedFile:
    uploaded_file = db.get(UploadedFile, uploaded_file_id)

    if uploaded_file is None:
        raise HTTPException(status_code=404, detail="Uploaded file not found")

    return uploaded_file


@router.get("/uploaded-files/{uploaded_file_id}/download")
def download_uploaded_file(
    uploaded_file_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
) -> FileResponse:
    uploaded_file = db.get(UploadedFile, uploaded_file_id)

    if uploaded_file is None:
        raise HTTPException(status_code=404, detail="Uploaded file not found")

    storage_path = Path(uploaded_file.storage_path)

    if not storage_path.exists():
        raise HTTPException(status_code=404, detail="Stored file is missing from disk")

    return FileResponse(
        path=storage_path,
        filename=uploaded_file.original_filename,
        media_type=uploaded_file.content_type or "application/octet-stream",
    )