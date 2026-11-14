"""
Test Suite for SwarmGuard FastAPI REST and WebSocket Endpoints.
Uses FastAPI TestClient to test all API routes, contract locking, drift checking,
ledger tampering, policy gate actions, demo scenarios, export, and SPA fallback.
Also tests schema alignment with frontend types.
"""

import json
import os
import pytest
from starlette.testclient import TestClient

from swarmguard.main import app, flight_recorder, contract_guard, policy_gate, demo_runner


@pytest.fixture
def client():
    """Provides a fresh TestClient with reset state for each test."""
    with TestClient(app) as test_client:
        yield test_client


def test_healthz_endpoint(client):
    """Verify /healthz returns service status and operational metadata."""
    resp = client.get("/healthz")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["service"] == "swarmguard"
    assert "version" in data
    assert "ledger_blocks" in data
    assert "gate_state" in data


def test_get_contract_endpoint(client):
    """Verify GET /api/contract schema matches frontend ContractInfo interface."""
    resp = client.get("/api/contract")
    assert resp.status_code == 200
    data = resp.json()
    # Required ContractInfo fields
    assert "name" in data
    assert "version" in data
    assert "hash" in data
    assert "locked_at" in data
    assert "endpoint" in data
    assert "spec_snippet" in data
    assert "status" in data
    assert data["status"] in ["LOCKED", "UNLOCKED", "DRIFTED"]


def test_lock_contract_endpoint(client):
    """Verify POST /api/contract/lock locks contract and returns genesis block."""
    resp = client.post(
        "/api/contract/lock",
        json={"spec_path": "contracts/checkout_contract.yaml"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["status"] == "LOCKED"
    assert len(data["fingerprint"]) == 64
    assert data["genesis_block"] is not None
    assert data["genesis_block"]["index"] >= 0
    assert data["genesis_block"]["worker_id"] == "@coordinator"
    assert data["genesis_block"]["action_type"] == "contract_lock"
    assert data["contract"]["name"] == "E-Commerce Checkout API"


def test_lock_contract_not_found(client):
    """Verify POST /api/contract/lock returns 404 for missing file."""
    resp = client.post(
        "/api/contract/lock",
        json={"spec_path": "contracts/does_not_exist.yaml"},
    )
    assert resp.status_code == 404


def test_drift_check_clean_diff(client):
    """Verify POST /api/drift/check evaluates clean diff without drift."""
    resp = client.post(
        "/api/drift/check",
        json={
            "worker_id": "@backend",
            "diff_text": "+ # Add clean comment to checkout endpoint",
            "action_type": "file_diff",
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["has_drift"] is False
    assert data["blocked"] is False
    assert data["gate_state"] == "VERIFIED_CLEAN"


def test_drift_check_breaking_diff_intercept(client):
    """Verify POST /api/drift/check intercepts breaking mutation and updates gate."""
    resp = client.post(
        "/api/drift/check",
        json={
            "worker_id": "@backend",
            "diff_text": "- total_amount: float\n+ amount_cents: int",
            "action_type": "file_diff",
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["has_drift"] is True
    assert data["blocked"] is True
    assert data["severity"] == "CRITICAL_BREAKING"
    assert data["gate_state"] == "INTERCEPTED_BLOCK"
    assert "total_amount" in data["drift"]["breaking_fields"]
    assert "amount_cents" in data["drift"]["breaking_fields"]

    # Verify drift event schema for frontend DriftFeed
    evt = data["drift_event"]
    assert evt is not None
    assert "id" in evt
    assert "timestamp" in evt
    assert "diff_text" in evt
    assert "gemini_analysis" in evt
    assert "summary" in evt["gemini_analysis"]
    assert "suggested_fix_prompt" in evt["gemini_analysis"]


def test_get_drift_events(client):
    """Verify GET /api/drift/events returns list of captured events."""
    resp = client.get("/api/drift/events")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_get_ledger_and_verify(client):
    """Verify GET /api/ledger and GET/POST /api/ledger/verify integrity checks."""
    resp = client.get("/api/ledger")
    assert resp.status_code == 200
    data = resp.json()
    assert "total_blocks" in data
    assert "valid" in data
    assert "chain" in data
    assert isinstance(data["chain"], list)

    # Verification endpoint via POST
    v_resp = client.post("/api/ledger/verify")
    assert v_resp.status_code == 200
    v_data = v_resp.json()
    assert "valid" in v_data
    assert "tampered_block_index" in v_data
    assert "algorithm" in v_data
    assert "total_blocks" in v_data

    # Verification endpoint via GET
    v_resp_get = client.get("/api/ledger/verify")
    assert v_resp_get.status_code == 200


def test_tamper_ledger_endpoint(client):
    """Verify POST /api/ledger/tamper simulates tamper and flags corrupted chain."""
    resp = client.post(
        "/api/ledger/tamper",
        json={"index": 0, "payload": {"malicious": "injected_payload"}},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["valid"] is False
    assert data["tampered_block_index"] == 0
    assert data["tampered_block"]["tampered"] is True


def test_tamper_ledger_out_of_bounds(client):
    """Verify POST /api/ledger/tamper returns 400 for out-of-bounds index."""
    resp = client.post("/api/ledger/tamper", json={"index": 99999})
    assert resp.status_code == 400


def test_gate_status_and_actions(client):
    """Verify GET /api/gate/status and POST /api/gate/action state transitions."""
    # Check gate status
    status_resp = client.get("/api/gate/status")
    assert status_resp.status_code == 200
    s_data = status_resp.json()
    assert "state" in s_data
    assert "last_updated" in s_data

    # Approve override action
    override_resp = client.post(
        "/api/gate/action",
        json={
            "action": "APPROVE_OVERRIDE",
            "operator_id": "operator_42",
            "reason": "Authorized major version bump",
        },
    )
    assert override_resp.status_code == 200
    o_data = override_resp.json()
    assert o_data["state"] == "OVERRIDE_APPROVED"
    assert o_data["argon2_seal"] is not None
    assert "$argon2id$" in o_data["argon2_seal"]

    # Reject & rollback action
    reject_resp = client.post(
        "/api/gate/action",
        json={
            "action": "REJECT_ROLLBACK",
            "operator_id": "operator_42",
            "reason": "Rejecting unauthorized drift",
        },
    )
    assert reject_resp.status_code == 200
    r_data = reject_resp.json()
    assert r_data["state"] == "ROLLBACK_REQUESTED"

    # Apply fix action
    fix_resp = client.post(
        "/api/gate/action",
        json={
            "action": "APPLY_FIX",
            "operator_id": "operator_42",
            "reason": "Applied Gemini remediation patch",
        },
    )
    assert fix_resp.status_code == 200
    f_data = fix_resp.json()
    assert f_data["state"] == "VERIFIED_CLEAN"


def test_demo_run_and_reset(client):
    """Verify POST /api/demo/run and POST /api/demo/reset lifecycle."""
    # Reset demo
    reset_resp = client.post("/api/demo/reset")
    assert reset_resp.status_code == 200
    r_data = reset_resp.json()
    assert r_data["success"] is True
    assert r_data["state"]["current_step"] == 1

    # Run step 2
    s2_resp = client.post("/api/demo/run", json={"step": 2})
    assert s2_resp.status_code == 200
    s2_data = s2_resp.json()
    assert s2_data["current_step"] == 2

    # Run full demo
    full_resp = client.post("/api/demo/run", json={})
    assert full_resp.status_code == 200
    full_data = full_resp.json()
    assert full_data["total_steps"] == 5
    assert len(full_data["logs"]) >= 5


def test_export_ledger_endpoint(client):
    """Verify GET /api/ledger/export returns downloadable cryptographic audit ledger."""
    resp = client.get("/api/ledger/export")
    assert resp.status_code == 200
    assert "attachment" in resp.headers.get("content-disposition", "")
    ledger = resp.json()
    assert "ledger_version" in ledger
    assert "export_timestamp" in ledger
    assert "total_blocks" in ledger
    assert "genesis_hash" in ledger
    assert "verification" in ledger
    assert "argon2_milestones" in ledger


def test_spa_fallback_serves_frontend(client):
    """Verify GET / serves frontend index.html from dist directory."""
    resp = client.get("/")
    assert resp.status_code == 200
    # Must serve the compiled HTML with Mission Control or doctype
    assert "<!doctype html>" in resp.text.lower() or "swarmguard" in resp.text.lower()


def test_websocket_telemetry(client):
    """Verify WebSocket /ws connects, receives INIT_STATE, and responds to PING."""
    with client.websocket_connect("/ws") as ws:
        init_data = ws.receive_json()
        assert init_data["type"] == "INIT_STATE"
        assert "contract" in init_data
        assert "blocks" in init_data
        assert "verification" in init_data
        assert "gate" in init_data
        assert "demo" in init_data

        # Test PING/PONG
        ws.send_json({"type": "PING"})
        pong_data = ws.receive_json()
        assert pong_data["type"] == "PONG"
        assert "timestamp" in pong_data
