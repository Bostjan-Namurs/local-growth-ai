from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: str = Field(default="local", alias="APP_ENV")
    app_name: str = Field(default="localgrowth-ai", alias="APP_NAME")
    app_version: str = Field(default="0.1.0", alias="APP_VERSION")
    log_level: str = Field(default="info", alias="LOG_LEVEL")

    api_host: str = Field(default="0.0.0.0", alias="API_HOST")
    api_port: int = Field(default=8000, alias="API_PORT")
    cors_origins: str = Field(default="http://localhost:3000", alias="CORS_ORIGINS")

    database_url: str | None = Field(default=None, alias="DATABASE_URL")
    redis_url: str | None = Field(default=None, alias="REDIS_URL")

    llm_mode: Literal["fake", "local", "cluster"] = Field(default="fake", alias="LLM_MODE")
    llm_gateway_base_url: str = Field(default="http://localhost:4000/v1", alias="LLM_GATEWAY_BASE_URL")
    llm_gateway_api_key: str | None = Field(default=None, alias="LLM_GATEWAY_API_KEY")

    enable_real_outreach: bool = Field(default=False, alias="ENABLE_REAL_OUTREACH")
    enable_production_deploy: bool = Field(default=False, alias="ENABLE_PRODUCTION_DEPLOY")
    enable_codex_handoff: bool = Field(default=False, alias="ENABLE_CODEX_HANDOFF")

    @property
    def database_configured(self) -> bool:
        return bool(self.database_url)


@lru_cache
def get_settings() -> Settings:
    return Settings()
