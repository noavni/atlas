from fastapi.testclient import TestClient

from api.index import app

client = TestClient(app)


def test_health_ok() -> None:
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_version_shape() -> None:
    r = client.get("/version")
    assert r.status_code == 200
    data = r.json()
    assert data["name"] == "atlas-api"
    assert "version" in data


def test_worker_drain_rejects_missing_secret() -> None:
    r = client.post("/internal/worker/drain")
    assert r.status_code == 401
