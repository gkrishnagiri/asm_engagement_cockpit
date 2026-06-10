from datetime import datetime, timezone
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import Settings, get_settings
from app.database import get_db
from app.security import (
    create_session_token,
    require_authenticated_request,
    verify_session_token,
)

router = APIRouter(prefix="/api", tags=["MVP 14 Diagnostics and MVP 15 Auth"])


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str
    display_name: str
    expires_in_minutes: int


class AuthStatusResponse(BaseModel):
    authenticated: bool
    auth_type: str
    username: str | None = None
    display_name: str | None = None
    expires_at: int | None = None
    expires_at_utc: str | None = None

    model_config = ConfigDict(extra="allow")


class RuntimeDiagnosticsResponse(BaseModel):
    app_name: str
    app_env: str
    database_status: str
    cors_origins: list[str]
    openai_model: str
    openai_tracing: bool
    openai_api_key_configured: bool
    api_auth_enabled: bool
    api_auth_key_configured: bool
    app_login_enabled: bool
    app_login_configured: bool
    app_login_username: str
    app_session_duration_minutes: int
    log_requests: bool


def _utc_from_epoch(epoch_seconds: int | None) -> str | None:
    if epoch_seconds is None:
        return None

    return datetime.fromtimestamp(epoch_seconds, tz=timezone.utc).isoformat()


@router.post("/auth/login", response_model=LoginResponse)
def login(
    payload: LoginRequest,
    settings: Settings = Depends(get_settings),
) -> LoginResponse:
    if not settings.app_login_enabled:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Application login is disabled.",
        )

    if not settings.login_is_ready:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Application login is enabled but login settings are not fully configured. "
                "Check APP_LOGIN_USERNAME, APP_LOGIN_PASSWORD, and APP_SESSION_SECRET_KEY."
            ),
        )

    username_matches = payload.username == settings.app_login_username
    password_matches = payload.password == settings.app_login_password

    if not username_matches or not password_matches:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
        )

    token = create_session_token(
        username=settings.app_login_username,
        display_name=settings.app_login_display_name,
        settings=settings,
    )

    return LoginResponse(
        access_token=token,
        username=settings.app_login_username,
        display_name=settings.app_login_display_name,
        expires_in_minutes=settings.app_session_duration_minutes,
    )


@router.get("/auth/status", response_model=AuthStatusResponse)
def get_auth_status(
    auth_context: Annotated[dict[str, Any], Depends(require_authenticated_request)],
) -> AuthStatusResponse:
    expires_at = auth_context.get("expires_at")

    return AuthStatusResponse(
        authenticated=bool(auth_context.get("authenticated")),
        auth_type=str(auth_context.get("auth_type")),
        username=auth_context.get("username"),
        display_name=auth_context.get("display_name"),
        expires_at=expires_at,
        expires_at_utc=_utc_from_epoch(expires_at),
    )


@router.post("/auth/verify-token", response_model=AuthStatusResponse)
def verify_token(
    token: str,
    settings: Settings = Depends(get_settings),
) -> AuthStatusResponse:
    payload = verify_session_token(token, settings)
    expires_at = payload.get("exp")

    return AuthStatusResponse(
        authenticated=True,
        auth_type="session",
        username=payload.get("sub"),
        display_name=payload.get("display_name"),
        expires_at=expires_at,
        expires_at_utc=_utc_from_epoch(expires_at),
    )


@router.get("/diagnostics/runtime", response_model=RuntimeDiagnosticsResponse)
def get_runtime_diagnostics(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[dict[str, Any], Depends(require_authenticated_request)],
    settings: Settings = Depends(get_settings),
) -> RuntimeDiagnosticsResponse:
    db_status = "unknown"

    try:
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as exc:
        db_status = f"error: {type(exc).__name__}"

    return RuntimeDiagnosticsResponse(
        app_name=settings.app_name,
        app_env=settings.app_env,
        database_status=db_status,
        cors_origins=settings.cors_origins,
        openai_model=settings.openai_model,
        openai_tracing=settings.openai_tracing,
        openai_api_key_configured=bool(settings.openai_api_key),
        api_auth_enabled=settings.api_auth_enabled,
        api_auth_key_configured=bool(settings.api_auth_key),
        app_login_enabled=settings.app_login_enabled,
        app_login_configured=settings.login_is_ready,
        app_login_username=settings.app_login_username,
        app_session_duration_minutes=settings.app_session_duration_minutes,
        log_requests=settings.log_requests,
    )