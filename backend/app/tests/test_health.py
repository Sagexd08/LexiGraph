import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/v1/health")
    assert response.status_code in (200, 503)
    data = response.json()
    assert "status" in data
    assert "timestamp" in data
