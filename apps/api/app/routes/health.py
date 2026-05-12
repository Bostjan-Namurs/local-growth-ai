from fastapi import APIRouter, Depends

from app.config import Settings, get_settings
from app.schemas import HealthResponse, VersionResponse

router = APIRouter(tags=["system"])


@router.get("/health", response_model=HealthResponse)
def health(settings: Settings = Depends(get_settings)) -> HealthResponse:
    return HealthResponse(
        app_env=settings.app_env,
        llm_mode=settings.llm_mode,
        database_configured=settings.database_configured,
    )


@router.get("/version", response_model=VersionResponse)
def version(settings: Settings = Depends(get_settings)) -> VersionResponse:
    return VersionResponse(app_name=settings.app_name, app_version=settings.app_version)
