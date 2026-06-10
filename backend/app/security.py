from typing import Annotated

from fastapi import Depends, Header, HTTPException, status

from app.config import Settings, get_settings


PUBLIC_PATH_PREFIXES = (
    "/api/health",
    "/docs",
    "/openapi.json",
    "/redoc",
)

PROTECTED_WRITE_METHODS = {"POST", "PUT", "PATCH", "DELETE"}


def is_public_path(path: str) -> bool:
    return any(path.startswith(prefix) for prefix in PUBLIC_PATH_PREFIXES)


def require_api_key(
    x_api_key: Annotated[str | None, Header(alias="X-API-Key")] = None,
    settings: Settings = Depends(get_settings),
) -> None:
    if not settings.api_auth_enabled:
        return

    if not settings.auth_is_ready:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="API authentication is enabled but API_AUTH_KEY is not configured.",
        )

    if not x_api_key or x_api_key != settings.api_auth_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid API key.",
        )