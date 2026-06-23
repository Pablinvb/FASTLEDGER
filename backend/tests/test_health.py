import os

os.environ.setdefault("SUPABASE_URL", "")
os.environ.setdefault("SUPABASE_ANON_KEY", "")
os.environ.setdefault("SUPABASE_SECRET_KEY", "")
os.environ.setdefault("GEMINI_API_KEY", "")
os.environ.setdefault("RESEND_API_KEY", "")

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_reports_optional_integrations():
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["integrations"] == {
        "supabase": False,
        "gemini": False,
        "resend": False,
    }


def test_root_exposes_docs_and_health():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["docs"] == "/docs"
