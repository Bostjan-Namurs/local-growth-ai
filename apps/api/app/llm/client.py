from typing import Any, Literal

from pydantic import BaseModel, Field

from app.config import Settings

ModelAlias = Literal["classifier", "extractor", "writer", "coder", "judge", "embedding"]


class LLMRequest(BaseModel):
    model_alias: ModelAlias
    task: str
    input: dict[str, Any] = Field(default_factory=dict)


class LLMResponse(BaseModel):
    model_alias: ModelAlias
    content: dict[str, Any]
    fake: bool = True


class LLMClient:
    """LLM gateway client with deterministic fake mode for tests and early development."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def complete(self, request: LLMRequest) -> LLMResponse:
        if self.settings.llm_mode == "fake":
            return self._fake_complete(request)
        raise NotImplementedError("Real LLM gateway calls are intentionally deferred from Sprint 1")

    def _fake_complete(self, request: LLMRequest) -> LLMResponse:
        if request.model_alias == "classifier":
            text = str(request.input.get("text", "")).lower()
            vertical_id = "bike_rental" if "bike" in text or "bicycle" in text else "unknown"
            return LLMResponse(model_alias=request.model_alias, content={"vertical_id": vertical_id})
        if request.model_alias == "judge":
            return LLMResponse(model_alias=request.model_alias, content={"passed": True, "issues": []})
        if request.model_alias == "writer":
            return LLMResponse(
                model_alias=request.model_alias,
                content={"text": "Draft proposal generated in fake LLM mode."},
            )
        return LLMResponse(model_alias=request.model_alias, content={"result": "fake_response"})
