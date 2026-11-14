"""
Unit tests for SwarmGuard Cryptographic Flight Recorder
"""

import pytest
from swarmguard.flight_recorder import FlightRecorder


def test_genesis_block_creation():
    fr = FlightRecorder()
    block = fr.record_event("@coordinator", "genesis", {"msg": "genesis initialized"})
    assert block["index"] == 0
    assert block["prev_hash"] == "0" * 64
    assert block["argon2_seal"] is not None
    assert block["worker_id"] == "@coordinator"
    assert len(fr.chain) == 1


def test_chain_linking_and_verification():
    fr = FlightRecorder()
    b0 = fr.record_event("@coordinator", "genesis", {"init": True})
    b1 = fr.record_event("@backend", "diff", {"code": "def func(): pass"})
    b2 = fr.record_event("@frontend", "fetch", {"url": "/api/v1/checkout"})

    assert b1["prev_hash"] == b0["block_hash"]
    assert b2["prev_hash"] == b1["block_hash"]

    report = fr.verify_chain()
    assert report["valid"] is True
    assert report["tampered_block_index"] is None
    assert report["total_blocks"] == 3


def test_tamper_detection_on_intermediate_block():
    fr = FlightRecorder()
    fr.record_event("@coordinator", "genesis", {"step": 0})
    fr.record_event("@backend", "diff", {"step": 1, "authorized": True})
    fr.record_event("@verifier", "audit", {"step": 2, "passed": True})

    # Verify clean initial state
    assert fr.verify_chain()["valid"] is True

    # Tamper with block index 1
    fr.tamper_block(1, {"step": 1, "authorized": False, "backdoor": "injected"})

    report = fr.verify_chain()
    assert report["valid"] is False
    assert report["tampered_block_index"] == 1


def test_argon2_milestone_seals():
    fr = FlightRecorder()
    b0 = fr.record_event("@coordinator", "genesis", "init", compute_seal=True)
    b1 = fr.record_event("@backend", "micro_event", "action", compute_seal=False)
    b2 = fr.record_event("@operator", "override", "approved", compute_seal=True)

    assert b0["argon2_seal"] is not None
    assert b1["argon2_seal"] is None
    assert b2["argon2_seal"] is not None
    assert "$argon2id$" in b2["argon2_seal"]


def test_export_ledger():
    fr = FlightRecorder()
    fr.record_event("@coordinator", "contract_lock", {"spec": "locked"})
    fr.record_event("@backend", "diff", {"status": "ok"})

    ledger = fr.export_ledger()
    assert ledger["total_blocks"] == 2
    assert ledger["genesis_hash"] is not None
    assert ledger["tip_hash"] is not None
    assert ledger["verification"]["valid"] is True
    assert len(ledger["argon2_milestones"]) >= 1
