"""
Test Suite for SwarmGuard Contract Guard.
Verifies OpenAPI contract locking, canonical fingerprinting, and AST/diff drift detection,
including detection of field renames, type mutations, and missing required fields.
"""

import os
import pytest
from swarmguard.contract_guard import ContractGuard
from swarmguard.flight_recorder import FlightRecorder

CONTRACT_PATH = os.path.join(os.path.dirname(__file__), "..", "contracts", "checkout_contract.yaml")


def test_lock_contract_genesis():
    """Verify lock_contract calculates SHA-256 fingerprint and creates genesis block."""
    recorder = FlightRecorder()
    guard = ContractGuard(flight_recorder=recorder)

    result = guard.lock_contract(CONTRACT_PATH)

    assert result["status"] == "LOCKED"
    assert result["title"] == "E-Commerce Checkout API"
    assert result["version"] == "1.0.0"
    assert "/api/v1/checkout" in result["endpoints"]
    assert len(result["fingerprint"]) == 64
    assert result["genesis_block"] is not None

    # Check that genesis block was recorded in FlightRecorder
    assert len(recorder.chain) == 1
    genesis = recorder.chain[0]
    assert genesis["worker_id"] == "@coordinator"
    assert genesis["action_type"] == "contract_lock"
    assert genesis["argon2_seal"] is not None
    assert "$argon2id$" in genesis["argon2_seal"]

    # Verify chain integrity
    assert recorder.verify_chain()["valid"] is True


def test_lock_contract_missing_file_raises():
    """Verify lock_contract raises FileNotFoundError if contract does not exist."""
    guard = ContractGuard()
    with pytest.raises(FileNotFoundError):
        guard.lock_contract("non_existent_contract.yaml")


def test_detect_total_amount_renamed_to_amount_cents():
    """Verify detection of critical breaking drift when total_amount is renamed to amount_cents."""
    guard = ContractGuard()
    guard.lock_contract(CONTRACT_PATH)

    breaking_diff = """
    @@ -18,3 +18,3 @@
    - total_amount: float
    + amount_cents: int
    """

    drift = guard.check_diff_drift(worker_id="@backend", diff_text=breaking_diff)

    assert drift["has_drift"] is True
    assert drift["severity"] == "CRITICAL_BREAKING"
    assert drift["drift_type"] == "SCHEMA_BREAKING_FIELD_MUTATION"
    assert "total_amount" in drift["breaking_fields"]
    assert "amount_cents" in drift["breaking_fields"]
    assert "@frontend" in drift["impacted_workers"]
    assert "Renamed required field 'total_amount: float' to 'amount_cents: int'" in drift["details"]


def test_clean_diff_no_drift():
    """Verify clean diff produces no drift."""
    guard = ContractGuard()
    guard.lock_contract(CONTRACT_PATH)

    clean_diff = """
    @@ -10,3 +10,5 @@
    + # Log incoming payment processing
    + logger.info(f"Processing order for customer {payload.customer_id}")
    """

    drift = guard.check_diff_drift(worker_id="@backend", diff_text=clean_diff)

    assert drift["has_drift"] is False
    assert drift["severity"] == "NONE"
    assert drift["drift_type"] == "CLEAN"
    assert len(drift["breaking_fields"]) == 0
    assert len(drift["impacted_workers"]) == 0


def test_detect_type_mutation_float_to_int():
    """Verify detection when total_amount type is mutated to int."""
    guard = ContractGuard()
    guard.lock_contract(CONTRACT_PATH)

    diff = "total_amount: int"
    drift = guard.check_diff_drift(worker_id="@backend", diff_text=diff)

    assert drift["has_drift"] is True
    assert drift["severity"] == "CRITICAL_BREAKING"
    assert drift["drift_type"] == "SCHEMA_TYPE_MUTATION"
    assert "total_amount" in drift["breaking_fields"]


def test_detect_missing_required_field():
    """Verify detection when a required contract field (e.g. currency) is removed."""
    guard = ContractGuard()
    guard.lock_contract(CONTRACT_PATH)

    diff = """
    @@ -20,2 +20,0 @@
    - currency: str
    """
    drift = guard.check_diff_drift(worker_id="@backend", diff_text=diff)

    assert drift["has_drift"] is True
    assert drift["severity"] == "CRITICAL_BREAKING"
    assert "currency" in drift["breaking_fields"]
    assert drift["drift_type"] == "SCHEMA_REQUIRED_FIELD_MISSING"
