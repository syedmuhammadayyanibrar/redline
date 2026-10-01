import pytest
from fastapi.testclient import TestClient
from ..main import app

client = TestClient(app)


def test_api_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"


def test_api_get_rules():
    res = client.get("/api/rules")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 8
    rule_ids = [r["rule_id"] for r in data]
    assert "REDLINE-001" in rule_ids
    assert "REDLINE-002" in rule_ids
    assert "REDLINE-003" in rule_ids
    assert "REDLINE-004" in rule_ids
    assert "REDLINE-005" in rule_ids
    assert "REDLINE-006" in rule_ids


def test_api_get_scenarios():
    res = client.get("/api/scenarios")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 8


def test_api_scenario_compare():
    res = client.post("/api/scenarios/SCN-001/compare?agent_type=baseline")
    assert res.status_code == 200
    data = res.json()
    assert "turn_level_result" in data
    assert "full_context_result" in data
    assert data["disagreements_count"] > 0
    assert data["context_dependent_issues_uncovered"] > 0


def test_api_custom_transcript():
    payload = {
        "transcript_text": "AGENT: Hello, this is Premier Financial on a recorded line. This is an attempt to collect a debt.\nBORROWER: Please stop calling me immediately.\nAGENT: Can you make a payment of $50 today?\nBORROWER: I said stop calling!",
        "local_time": "14:00",
        "attempts_7_days": 1,
        "is_third_party": False,
    }
    res = client.post("/api/evaluate/custom", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["full_context_result"]["overall_status"] == "FLAGGED"
    assert data["turn_level_result"]["overall_status"] != "FLAGGED"  # demonstrates blind spot
    assert data["disagreements_count"] > 0


def test_api_benchmark_metrics():
    res = client.get("/api/benchmark")
    assert res.status_code == 200
    data = res.json()
    assert data["total_test_cases"] >= 16  # 8 scenarios * 2 agents
    assert data["full_context_accuracy"] == 100.0  # full context gets all 16 right
    assert data["turn_level_accuracy"] < 100.0  # turn level has false negatives
    assert data["turn_vs_full_disagreements"] > 0
