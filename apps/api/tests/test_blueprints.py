from pathlib import Path

from fastapi.testclient import TestClient

from app.main import app
from app.services.blueprints import BlueprintRegistry


client = TestClient(app)


def test_blueprint_registry_lists_bike_rental() -> None:
    response = client.get("/blueprints")
    assert response.status_code == 200
    ids = {item["vertical_id"] for item in response.json()["verticals"]}
    assert "bike_rental" in ids


def test_load_bike_rental_blueprint() -> None:
    response = client.get("/blueprints/bike_rental")
    assert response.status_code == 200
    data = response.json()
    assert data["vertical_id"] == "bike_rental"
    assert data["registry"]["app_pattern"] == "rental_booking"
    assert data["blueprint"]["id"] == "bike_rental"


def test_unknown_blueprint_returns_404() -> None:
    response = client.get("/blueprints/not_real")
    assert response.status_code == 404


def test_blueprint_registry_can_load_from_custom_path(tmp_path: Path) -> None:
    (tmp_path / "registry.yaml").write_text("verticals:\n  test:\n    name: Test\n")
    registry = BlueprintRegistry(root=tmp_path)
    assert registry.list_verticals()[0]["vertical_id"] == "test"
