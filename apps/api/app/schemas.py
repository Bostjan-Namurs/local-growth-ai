from typing import Any, Literal

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: Literal["ok"] = "ok"
    app_env: str
    llm_mode: str
    database_configured: bool


class VersionResponse(BaseModel):
    app_name: str
    app_version: str


class BlueprintSummary(BaseModel):
    vertical_id: str
    name: str
    app_pattern: str | None = None
    template_id: str | None = None
    status: str | None = None


class BlueprintRegistryResponse(BaseModel):
    verticals: list[BlueprintSummary]


class BlueprintDetailResponse(BaseModel):
    vertical_id: str
    registry: dict[str, Any] = Field(default_factory=dict)
    blueprint: dict[str, Any] = Field(default_factory=dict)
