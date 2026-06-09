from fastapi import APIRouter, HTTPException

from app.schemas.mvp6_refinement import TextRefinementRequest, TextRefinementResponse

router = APIRouter(prefix="/api", tags=["MVP 6 Dictation Refinement"])


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