"""Endpoint tests for the FastAPI gateway - health, capabilities, skills, logs, diagnostics."""

import pytest
from fastapi.testclient import TestClient

from streamfog_mcp import server


@pytest.fixture(scope="module")
def client():
    with TestClient(server.app) as c:
        yield c


def test_health_endpoint(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["server"] == "Streamfog MCP"
    assert body["version"] == "0.1.0"
    assert body["uptime_seconds"] >= 0
    assert body["tool_count"] >= 5
    assert "streamerbot" in body["providers"]


def test_capabilities_endpoint(client):
    r = client.get("/api/capabilities")
    assert r.status_code == 200
    body = r.json()
    assert "streamfog_status" in body["tools"]
    assert body["ports"]["backend"] == 10994
    assert body["features"]["mcp_streamable_http"] == "/mcp"


def test_tools_endpoint_lists_all_tools(client):
    r = client.get("/api/tools")
    assert r.status_code == 200
    names = [t["name"] for t in r.json()["data"]["tools"]]
    for expected in [
        "streamfog_status",
        "streamfog_set_lens",
        "streamfog_clear_effects",
        "streamfog_toggle_avatar",
        "streamfog_list_lenses",
    ]:
        assert expected in names


def test_skills_endpoint(client):
    r = client.get("/api/skills")
    assert r.status_code == 200
    assert r.json()["data"]["count"] >= 1
    r2 = client.get("/api/skills/streamfog")
    assert r2.status_code == 200
    assert "streamfog_set_lens" in r2.json()["content"]
    r3 = client.get("/api/skills/nope")
    assert r3.status_code == 404


def test_logs_endpoint(client):
    r = client.get("/api/logs")
    assert r.status_code == 200
    assert "records" in r.json()["data"]


def test_diagnostics_endpoint(client):
    r = client.get("/api/v1/diagnostics")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["tool_count"] >= 5
    assert body["system"]["windows"] is True


def test_set_lens_empty_identifier_fails(client):
    r = client.post("/api/v1/lenses/set", json={"lens_identifier": ""})
    assert r.status_code == 200
    assert r.json()["success"] is False


def test_reload_lenses_returns_mapping(client):
    r = client.post("/api/v1/lenses/reload")
    assert r.status_code == 200
    body = r.json()
    assert body["success"] is True
    assert "count" in body["data"]
