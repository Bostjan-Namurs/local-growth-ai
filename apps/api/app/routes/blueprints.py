from fastapi import APIRouter, HTTPException

from app.schemas import BlueprintDetailResponse, BlueprintRegistryResponse, BlueprintSummary
from app.services.blueprints import BlueprintError, BlueprintRegistry

router = APIRouter(prefix="/blueprints", tags=["blueprints"])


@router.get("", response_model=BlueprintRegistryResponse)
def list_blueprints() -> BlueprintRegistryResponse:
    try:
        registry = BlueprintRegistry()
        verticals = [BlueprintSummary(**item) for item in registry.list_verticals()]
        return BlueprintRegistryResponse(verticals=verticals)
    except BlueprintError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/{vertical_id}", response_model=BlueprintDetailResponse)
def get_blueprint(vertical_id: str) -> BlueprintDetailResponse:
    try:
        return BlueprintDetailResponse(**BlueprintRegistry().load_blueprint(vertical_id))
    except BlueprintError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
