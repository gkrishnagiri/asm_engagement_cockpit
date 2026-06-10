from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import Settings, get_settings
from app.database import get_db
from app.security import require_api_key

router = APIRouter(prefix="/api", tags=["MVP 14 Diagnostics"])


@router.get("/diagnostics/runtime")
def get_runtime_diagnostics(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[None, Depends(require_api_key)],
    settings: Settings = Depends(get_settings),
) -> dict[str, object]:
    db_status = "unknown"

    try:
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as exc:
        db_status = f"error: {type(exc).__name__}"

    return {
        "app_name": settings.app_name,
        "app_env": settings.app_env,
        "database_status": db_status,
        "cors_origins": settings.cors_origins,
        "openai_model": settings.openai_model,
        "openai_tracing": settings.openai_tracing,
        "openai_api_key_configured": bool(settings.openai_api_key),
        "api_auth_enabled": settings.api_auth_enabled,
        "api_auth_key_configured": bool(settings.api_auth_key),
        "log_requests": settings.log_requests,
    }