from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["llm_mode"] == "fake"


def test_version() -> None:
    response = client.get("/version")
    assert response.status_code == 200
    data = response.json()
    assert data["app_name"] == "localgrowth-ai"
    assert data["app_version"]
