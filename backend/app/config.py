"""Application configuration loaded from environment variables / .env."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/ directory (parent of app/). Relative paths resolve against this.
BASE_DIR = Path(__file__).resolve().parent.parent

# Prompt version is logged with every request for auditability.
PROMPT_VERSION = "2024-06-legal-intake-v1"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # OpenAI
    openai_api_key: str = ""
    openai_model: str = "gpt-4.1-mini"
    demo_mode: bool = False

    # App
    app_env: str = "development"
    database_path: str = "data/intake_records.sqlite3"
    audit_log_path: str = "logs/audit.jsonl"
    log_redact_pii: bool = True
    max_description_chars: int = 10_000

    # CORS
    cors_origins: str = "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173"

    # Optional integrations
    slack_webhook_url: str = ""
    airtable_api_key: str = ""
    airtable_base_id: str = ""
    airtable_table_name: str = "Intake Records"

    @property
    def database_file(self) -> Path:
        return self._resolve(self.database_path)

    @property
    def audit_log_file(self) -> Path:
        return self._resolve(self.audit_log_path)

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def airtable_configured(self) -> bool:
        return bool(self.airtable_api_key and self.airtable_base_id and self.airtable_table_name)

    @staticmethod
    def _resolve(value: str) -> Path:
        p = Path(value)
        return p if p.is_absolute() else BASE_DIR / p


@lru_cache
def get_settings() -> Settings:
    """Cached settings singleton."""
    return Settings()
