import time
from collections.abc import Awaitable, Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import get_settings
from app.security import is_public_path


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        settings = get_settings()

        if not settings.log_requests:
            return await call_next(request)

        start = time.perf_counter()

        response = await call_next(request)

        duration_ms = round((time.perf_counter() - start) * 1000, 2)

        print(
            f"{request.method} {request.url.path} "
            f"status={response.status_code} duration_ms={duration_ms}"
        )

        return response


class ApiKeyProtectionMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        settings = get_settings()

        if not settings.api_auth_enabled:
            return await call_next(request)

        if is_public_path(request.url.path):
            return await call_next(request)

        if request.method.upper() not in {"POST", "PUT", "PATCH", "DELETE"}:
            return await call_next(request)

        if not settings.auth_is_ready:
            return Response(
                content='{"detail":"API authentication is enabled but API_AUTH_KEY is not configured."}',
                media_type="application/json",
                status_code=500,
            )

        api_key = request.headers.get("X-API-Key")

        if api_key != settings.api_auth_key:
            return Response(
                content='{"detail":"Missing or invalid API key."}',
                media_type="application/json",
                status_code=401,
            )

        return await call_next(request)