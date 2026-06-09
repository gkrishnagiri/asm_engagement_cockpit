from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_ROOT = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    app_name: str = "ASM Engagement Cockpit"
    app_env: str = "local"

    backend_cors_origins: str = "http://localhost:3020,http://127.0.0.1:3020"

    database_url: str = Field(
        default="postgresql+psycopg2://asm_user:asm_password@localhost:5434/asm_cockpit"
    )

    openai_api_key: str | None = None
    openai_tracing: bool = True
    openai_model: str = "gpt-4.1-mini"

    model_config = SettingsConfigDict(
        env_file=str(BACKEND_ROOT / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def cors_origins(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.backend_cors_origins.split(",")
            if origin.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()