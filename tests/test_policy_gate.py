"""
Test Suite for SwarmGuard Smart Policy Gate.
Verifies finite state machine transitions, auto-block on breaking drift,
operator approval override with Argon2id proofs, and rollback dispatch.
"""

import os
import pytest
from swarmguard.contract_guard import ContractGuard
from swarmguard.flight_recorder import FlightRecorder
from swarmguard.gemini_analyzer import GeminiAnalyzer
from swarmguard.policy_gate import GateState, PolicyGate

CONTRACT_PATH = os.path.join(os.path.dirname(__file__), "..", "contracts", "checkout_contract.yaml")


@pytest.fixture
def setup_gate():
    recorder = FlightRecorder()
    guard = ContractGuard(flight_recorder=recorder)
    guard.lock_contract(CONTRACT_PATH)
    analyzer = GeminiAnalyzer()
    gate = PolicyGate(
        flight_recorder=recorder,
        contract_guard=guard,
        gemini_analyzer=analyzer,
    )
    return gate, recorder, guard, analyzer


def test_initial_gate_state(setup_gate):
    """Verify newly initialized policy gate starts in VERIFIED_CLEAN state."""
    gate, _, _, _ = setup_gate
    assert gate.state == GateState.VERIFIED_CLEAN
    assert gate.active_intercept is None

    status = gate.get_status()
    assert status["state"] == GateState.VERIFIED_CLEAN
    assert status["active_intercept"] is None
    assert status["total_overrides"] == 0


def test_auto_block_on_breaking_drift(setup_gate):
    """Verify that breaking drift automatically transitions gate to INTERCEPTED_BLOCK."""
    gate, recorder, guard, analyzer = setup_gate

    breaking_diff = "- total_amount: float\n+ amount_cents: int"
    result = gate.evaluate_action(
        worker_id="@backend",
        action_type="file_diff",
        diff_text=breaking_diff,
    )

    assert result["blocked"] is True
    assert result["state"] == GateState.INTERCEPTED_BLOCK
    assert gate.state == GateState.INTERCEPTED_BLOCK
    assert gate.active_intercept is not None
    assert gate.active_intercept["worker_id"] == "@backend"

    # Check Gemini analysis was generated (live or heuristic fallback)
    analysis = result["analysis"]
    assert "summary" in analysis
    assert "remediation_patch" in analysis
    assert "backend_prompt" in analysis
    assert "frontend_prompt" in analysis

    # Check block was recorded in FlightRecorder
    last_block = recorder.chain[-1]
    assert last_block["action_type"] == "gate_intercept"
    assert last_block["payload"]["event"] == "DRIFT_INTERCEPTED"


def test_clean_diff_evaluates_clean(setup_gate):
    """Verify clean diff keeps state as VERIFIED_CLEAN."""
    gate, recorder, _, _ = setup_gate

    clean_diff = "+ # Clean comment addition"
    result = gate.evaluate_action(
        worker_id="@frontend",
        action_type="file_diff",
        diff_text=clean_diff,
    )

    assert result["blocked"] is False
    assert result["state"] == GateState.VERIFIED_CLEAN
    assert gate.state == GateState.VERIFIED_CLEAN
    assert gate.active_intercept is None


def test_operator_approval_override(setup_gate):
    """Verify operator approval sets state to OVERRIDE_APPROVED and seals with Argon2id."""
    gate, recorder, _, _ = setup_gate

    # First intercept a breaking diff
    gate.evaluate_action("@backend", "diff", "- total_amount\n+ amount_cents")
    assert gate.state == GateState.INTERCEPTED_BLOCK

    # Operator approves breaking change
    override = gate.approve_override(
        operator_id="@human_operator",
        reason="Approved v2 checkout migration to integer cents",
    )

    assert override["status"] == "OVERRIDE_APPROVED"
    assert override["state"] == GateState.OVERRIDE_APPROVED
    assert gate.state == GateState.OVERRIDE_APPROVED
    assert gate.active_intercept is None  # cleared after resolution

    # Verify Argon2id milestone seal was generated and saved
    assert override["argon2_seal"] is not None
    assert "$argon2id$" in override["argon2_seal"]

    # Verify ledger integrity includes override block
    last_block = recorder.chain[-1]
    assert last_block["action_type"] == "gate_override"
    assert last_block["argon2_seal"] == override["argon2_seal"]
    assert recorder.verify_chain()["valid"] is True


def test_reject_and_rollback(setup_gate):
    """Verify rejection transitions gate to ROLLBACK_REQUESTED and logs rollback block."""
    gate, recorder, _, _ = setup_gate

    # Intercept breaking diff
    gate.evaluate_action("@backend", "diff", "- total_amount\n+ amount_cents")
    assert gate.state == GateState.INTERCEPTED_BLOCK

    # Reject and trigger rollback
    rejection = gate.reject_and_rollback(worker_id="@backend")

    assert rejection["status"] == "ROLLBACK_REQUESTED"
    assert rejection["state"] == GateState.ROLLBACK_REQUESTED
    assert rejection["target_worker"] == "@backend"
    assert gate.state == GateState.ROLLBACK_REQUESTED

    # Verify block in FlightRecorder
    last_block = recorder.chain[-1]
    assert last_block["action_type"] == "gate_rollback"
    assert last_block["payload"]["target_worker"] == "@backend"
    assert recorder.verify_chain()["valid"] is True


def test_reset_policy_gate(setup_gate):
    """Verify reset restores gate to clean state."""
    gate, _, _, _ = setup_gate
    gate.evaluate_action("@backend", "diff", "- total_amount\n+ amount_cents")
    assert gate.state == GateState.INTERCEPTED_BLOCK

    gate.reset()
    assert gate.state == GateState.VERIFIED_CLEAN
    assert gate.active_intercept is None
