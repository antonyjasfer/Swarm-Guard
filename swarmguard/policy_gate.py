"""
Smart Policy Gate for SwarmGuard
Enforces zero-drift gate policies, intercepts breaking contract mutations,
and seals human operator overrides with Argon2id proofs.
"""

from typing import Any, Dict, List, Optional

from swarmguard.contract_guard import ContractGuard
from swarmguard.flight_recorder import FlightRecorder
from swarmguard.gemini_analyzer import GeminiAnalyzer


class GateState:
    VERIFIED_CLEAN = "VERIFIED_CLEAN"
    INTERCEPTED_BLOCK = "INTERCEPTED_BLOCK"
    OVERRIDE_APPROVED = "OVERRIDE_APPROVED"
    ROLLBACK_REQUESTED = "ROLLBACK_REQUESTED"


class PolicyGate:
    """
    Finite state machine guarding swarm actions against contract drift.
    Transitions:
      VERIFIED_CLEAN -> INTERCEPTED_BLOCK (on breaking drift)
      INTERCEPTED_BLOCK -> OVERRIDE_APPROVED (on human operator approval with Argon2id seal)
      INTERCEPTED_BLOCK -> ROLLBACK_REQUESTED (on rejection / rollback dispatch)
    """

    def __init__(
        self,
        flight_recorder: Optional[FlightRecorder] = None,
        contract_guard: Optional[ContractGuard] = None,
        gemini_analyzer: Optional[GeminiAnalyzer] = None,
    ):
        self.flight_recorder = flight_recorder
        self.contract_guard = contract_guard
        self.gemini_analyzer = gemini_analyzer
        self.state: str = GateState.VERIFIED_CLEAN
        self.active_intercept: Optional[Dict[str, Any]] = None
        self.override_history: List[Dict[str, Any]] = []

    def evaluate_action(
        self,
        worker_id: str,
        action_type: str,
        diff_text: str,
        contract_guard: Optional[ContractGuard] = None,
        flight_recorder: Optional[FlightRecorder] = None,
        gemini_analyzer: Optional[GeminiAnalyzer] = None,
    ) -> Dict[str, Any]:
        """
        Evaluates a worker's code/tool diff against the locked contract.
        If breaking drift is detected:
          1. Transitions state to INTERCEPTED_BLOCK.
          2. Generates root-cause analysis and remediation via GeminiAnalyzer.
          3. Logs intercept block to FlightRecorder.
          4. Halts execution.
        """
        c_guard = contract_guard or self.contract_guard
        f_recorder = flight_recorder or self.flight_recorder
        g_analyzer = gemini_analyzer or self.gemini_analyzer or GeminiAnalyzer()

        if c_guard is None:
            # If no contract guard configured, action passes
            return {
                "state": self.state,
                "blocked": False,
                "reason": "No contract locked in ContractGuard",
            }

        drift = c_guard.check_diff_drift(worker_id=worker_id, diff_text=diff_text)

        if drift.get("has_drift"):
            self.state = GateState.INTERCEPTED_BLOCK
            analysis = g_analyzer.analyze_drift(
                worker_id=worker_id,
                diff_text=diff_text,
                drift_info=drift,
                contract_summary=c_guard.get_contract(),
            )

            self.active_intercept = {
                "worker_id": worker_id,
                "action_type": action_type,
                "diff_text": diff_text,
                "drift": drift,
                "analysis": analysis,
            }

            block = None
            if f_recorder is not None:
                block = f_recorder.record_event(
                    worker_id=worker_id,
                    action_type="gate_intercept",
                    payload={
                        "event": "DRIFT_INTERCEPTED",
                        "gate_state": self.state,
                        "drift": drift,
                        "analysis": analysis,
                    },
                    compute_seal=False,
                )

            return {
                "state": self.state,
                "blocked": True,
                "drift": drift,
                "analysis": analysis,
                "block": block,
            }

        # Clean diff: maintains or resets to VERIFIED_CLEAN
        self.state = GateState.VERIFIED_CLEAN
        self.active_intercept = None

        block = None
        if f_recorder is not None:
            block = f_recorder.record_event(
                worker_id=worker_id,
                action_type="gate_pass",
                payload={
                    "event": "VERIFIED_CLEAN",
                    "gate_state": self.state,
                    "action_type": action_type,
                    "worker_id": worker_id,
                },
                compute_seal=False,
            )

        return {
            "state": self.state,
            "blocked": False,
            "drift": drift,
            "block": block,
        }

    def approve_override(
        self,
        operator_id: str,
        reason: str,
        flight_recorder: Optional[FlightRecorder] = None,
    ) -> Dict[str, Any]:
        """
        Human operator approves a breaking migration.
        Transitions state to OVERRIDE_APPROVED, calculates a memory-hard
        Argon2id milestone seal, and writes it to the cryptographic flight recorder.
        """
        f_recorder = flight_recorder or self.flight_recorder
        self.state = GateState.OVERRIDE_APPROVED

        block = None
        if f_recorder is not None:
            block = f_recorder.record_event(
                worker_id=operator_id,
                action_type="gate_override",
                payload={
                    "event": "OPERATOR_OVERRIDE_APPROVED",
                    "operator_id": operator_id,
                    "reason": reason,
                    "previous_intercept": self.active_intercept,
                },
                compute_seal=True,
            )

        override_entry = {
            "operator_id": operator_id,
            "reason": reason,
            "milestone_block": block,
            "argon2_seal": block.get("argon2_seal") if block else None,
        }
        self.override_history.append(override_entry)
        self.active_intercept = None

        return {
            "state": self.state,
            "status": "OVERRIDE_APPROVED",
            "operator_id": operator_id,
            "reason": reason,
            "block": block,
            "argon2_seal": block.get("argon2_seal") if block else None,
        }

    def reject_and_rollback(
        self,
        worker_id: str,
        flight_recorder: Optional[FlightRecorder] = None,
    ) -> Dict[str, Any]:
        """
        Rejects breaking drift and requests rollback to last verified clean state.
        Transitions state to ROLLBACK_REQUESTED and logs the gate event.
        """
        f_recorder = flight_recorder or self.flight_recorder
        self.state = GateState.ROLLBACK_REQUESTED

        block = None
        if f_recorder is not None:
            block = f_recorder.record_event(
                worker_id=worker_id,
                action_type="gate_rollback",
                payload={
                    "event": "ROLLBACK_DISPATCHED",
                    "target_worker": worker_id,
                    "active_intercept": self.active_intercept,
                },
                compute_seal=False,
            )

        previous_intercept = self.active_intercept
        self.active_intercept = None

        return {
            "state": self.state,
            "status": "ROLLBACK_REQUESTED",
            "target_worker": worker_id,
            "previous_intercept": previous_intercept,
            "block": block,
        }

    def get_status(self) -> Dict[str, Any]:
        """Returns the current state and active interception details of the policy gate."""
        return {
            "state": self.state,
            "active_intercept": self.active_intercept,
            "total_overrides": len(self.override_history),
            "latest_override": self.override_history[-1] if self.override_history else None,
        }

    def reset(self) -> None:
        """Resets the policy gate to clean baseline."""
        self.state = GateState.VERIFIED_CLEAN
        self.active_intercept = None
