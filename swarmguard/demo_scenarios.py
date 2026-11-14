"""
Demo Scenario Simulator for SwarmGuard
Simulates realistic multi-agent collision, zero-drift interception,
Gemini root-cause remediation, and cryptographic chain verification.
"""

from datetime import datetime, timezone
import os
from typing import Any, Callable, Dict, List, Optional

from swarmguard.contract_guard import ContractGuard
from swarmguard.flight_recorder import FlightRecorder
from swarmguard.gemini_analyzer import GeminiAnalyzer
from swarmguard.policy_gate import GateState, PolicyGate


# Pre-defined realistic multi-agent diffs for the E-Commerce Checkout API collision scenario
BACKEND_BREAKING_DIFF = """--- a/services/checkout/schemas.py
+++ b/services/checkout/schemas.py
@@ -8,8 +8,8 @@
 class CheckoutRequest(BaseModel):
     items: List[OrderItem]
-    total_amount: float
+    amount_cents: int
     currency: str
     customer_id: str
"""

FRONTEND_COLLISION_CODE = """// frontend/src/services/checkoutClient.ts
export async function submitCheckout(items: CartItem[], totalAmount: number): Promise<CheckoutResponse> {
  const payload = {
    items,
    total_amount: totalAmount, // Contract requires total_amount: float
    currency: "USD",
    customer_id: getCustomerId()
  };
  const response = await apiClient.post("/api/v1/checkout", payload);
  return response.data;
}
"""


class DemoScenarioRunner:
    """
    Executes and tracks the multi-agent collision demonstration:
      Step 1: @coordinator locks contracts/checkout_contract.yaml (Genesis block + Argon2id seal).
      Step 2: @backend attempts to rename total_amount: float -> amount_cents: int.
      Step 3: @frontend pushes code calling /api/v1/checkout expecting total_amount.
      Step 4: SwarmGuard Interceptor halts pipeline (INTERCEPTED_BLOCK) and generates Gemini fix prompt.
      Step 5: @verifier validates ledger integrity and cryptographic chain proof.
    """

    def __init__(
        self,
        flight_recorder: Optional[FlightRecorder] = None,
        contract_guard: Optional[ContractGuard] = None,
        gemini_analyzer: Optional[GeminiAnalyzer] = None,
        policy_gate: Optional[PolicyGate] = None,
        contract_path: Optional[str] = None,
    ):
        self.flight_recorder = flight_recorder or FlightRecorder()
        self.contract_guard = contract_guard or ContractGuard(flight_recorder=self.flight_recorder)
        self.gemini_analyzer = gemini_analyzer or GeminiAnalyzer()
        self.policy_gate = policy_gate or PolicyGate(
            flight_recorder=self.flight_recorder,
            contract_guard=self.contract_guard,
            gemini_analyzer=self.gemini_analyzer,
        )

        self.contract_path = (
            contract_path
            or os.path.join(os.getcwd(), "contracts", "checkout_contract.yaml")
        )

        self.current_step = 0
        self.is_running = False
        self.step_history: List[Dict[str, Any]] = []
        self.last_result: Optional[Dict[str, Any]] = None

    def get_demo_state(self) -> Dict[str, Any]:
        """Returns the full state of the demo scenario."""
        contract = self.contract_guard.get_contract()
        gate_status = self.policy_gate.get_status()
        verification = self.flight_recorder.verify_chain()

        return {
            "current_step": self.current_step,
            "total_steps": 5,
            "is_running": self.is_running,
            "contract_locked": contract is not None,
            "contract_fingerprint": self.contract_guard.get_fingerprint(),
            "gate_state": gate_status.get("state"),
            "active_intercept": gate_status.get("active_intercept"),
            "total_blocks": len(self.flight_recorder.chain),
            "chain_valid": verification.get("valid", True),
            "step_history": self.step_history,
            "last_result": self.last_result,
        }

    def reset_demo(self) -> Dict[str, Any]:
        """Resets the demo scenario and clears all state to a clean baseline."""
        self.current_step = 0
        self.is_running = False
        self.step_history.clear()
        self.last_result = None

        self.flight_recorder.reset()
        self.policy_gate.reset()
        self.contract_guard.locked_contract = None
        self.contract_guard.contract_fingerprint = None
        self.contract_guard.raw_contract_text = None

        return {
            "status": "RESET_SUCCESS",
            "message": "SwarmGuard demo reset to clean baseline",
            "state": self.get_demo_state(),
        }

    def run_step_1_lock_contract(self) -> Dict[str, Any]:
        """
        Step 1: @coordinator locks contracts/checkout_contract.yaml.
        Computes canonical SHA-256 fingerprint, stores as genesis contract,
        and records Genesis block with Argon2id memory-hard seal.
        """
        self.current_step = 1

        # Check if contract exists on disk, fallback to default relative if needed
        c_path = self.contract_path
        if not os.path.exists(c_path):
            alt_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "contracts", "checkout_contract.yaml")
            if os.path.exists(alt_path):
                c_path = alt_path

        lock_res = self.contract_guard.lock_contract(
            contract_path=c_path,
            flight_recorder=self.flight_recorder,
        )

        step_data = {
            "step": 1,
            "name": "CONTRACT_LOCK",
            "worker": "@coordinator",
            "title": "OpenAPI Contract Sealed & Locked",
            "description": "@coordinator locks `contracts/checkout_contract.yaml`. Genesis block #0 created with SHA-256 + Argon2id proof seal.",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "data": {
                "contract_path": c_path,
                "fingerprint": lock_res.get("fingerprint"),
                "endpoints": lock_res.get("endpoints"),
                "genesis_block": lock_res.get("genesis_block"),
            },
        }

        self.step_history.append(step_data)
        self.last_result = step_data
        return step_data

    def run_step_2_backend_drift(self) -> Dict[str, Any]:
        """
        Step 2: @backend attempts to modify /api/v1/checkout request schema
        by renaming total_amount: float -> amount_cents: int.
        Flight recorder logs the incoming code diff event.
        """
        self.current_step = 2

        # Record backend's tool call / push event
        diff_block = self.flight_recorder.record_event(
            worker_id="@backend",
            action_type="file_diff",
            payload={
                "event": "CODE_PUSH",
                "file": "services/checkout/schemas.py",
                "diff": BACKEND_BREAKING_DIFF,
                "commit_msg": "refactor: use integer cents for checkout amount",
            },
            compute_seal=False,
        )

        step_data = {
            "step": 2,
            "name": "BACKEND_DIFF_PUSH",
            "worker": "@backend",
            "title": "@backend Pushes Unauthorized Schema Mutation",
            "description": "@backend attempts to rename locked field `total_amount: float` to `amount_cents: int`.",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "data": {
                "diff": BACKEND_BREAKING_DIFF,
                "file": "services/checkout/schemas.py",
                "block": diff_block,
            },
        }

        self.step_history.append(step_data)
        self.last_result = step_data
        return step_data

    def run_step_3_frontend_collision(self) -> Dict[str, Any]:
        """
        Step 3: @frontend simultaneously pushes code calling /api/v1/checkout
        expecting total_amount: float, creating an imminent runtime breaking collision.
        """
        self.current_step = 3

        # Record frontend's code push
        fe_block = self.flight_recorder.record_event(
            worker_id="@frontend",
            action_type="file_diff",
            payload={
                "event": "CODE_PUSH",
                "file": "frontend/src/services/checkoutClient.ts",
                "code": FRONTEND_COLLISION_CODE,
                "commit_msg": "feat: integrate checkout checkout client with total_amount",
            },
            compute_seal=False,
        )

        step_data = {
            "step": 3,
            "name": "FRONTEND_COLLISION",
            "worker": "@frontend",
            "title": "@frontend Integrates Against Locked Contract",
            "description": "@frontend submits code expecting `total_amount`. A cross-worker schema collision is now primed.",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "data": {
                "code": FRONTEND_COLLISION_CODE,
                "file": "frontend/src/services/checkoutClient.ts",
                "block": fe_block,
            },
        }

        self.step_history.append(step_data)
        self.last_result = step_data
        return step_data

    def run_step_4_intercept_and_analyze(self) -> Dict[str, Any]:
        """
        Step 4: SwarmGuard Interceptor intercepts the collision,
        flags CRITICAL_BREAKING drift, triggers INTERCEPTED_BLOCK at the
        Smart Policy Gate, and queries GeminiAnalyzer for automated fix prompts.
        """
        self.current_step = 4

        # Evaluate through policy gate
        gate_res = self.policy_gate.evaluate_action(
            worker_id="@backend",
            action_type="file_diff",
            diff_text=BACKEND_BREAKING_DIFF,
            contract_guard=self.contract_guard,
            flight_recorder=self.flight_recorder,
            gemini_analyzer=self.gemini_analyzer,
        )

        step_data = {
            "step": 4,
            "name": "DRIFT_INTERCEPTED",
            "worker": "SwarmGuard Interceptor",
            "title": "Collision Intercepted & Smart Policy Gate Blocked",
            "description": "SwarmGuard detects CRITICAL_BREAKING schema drift. Pipeline halted at INTERCEPTED_BLOCK. Gemini 2.5 Flash produces zero-drift remediation instructions.",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "data": {
                "gate_state": gate_res.get("state"),
                "blocked": gate_res.get("blocked"),
                "drift": gate_res.get("drift"),
                "analysis": gate_res.get("analysis"),
                "block": gate_res.get("block"),
            },
        }

        self.step_history.append(step_data)
        self.last_result = step_data
        return step_data

    def run_step_5_verify_ledger(self) -> Dict[str, Any]:
        """
        Step 5: @verifier validates contract ledger and verifies cryptographic chain integrity.
        Records verification block with audit receipt.
        """
        self.current_step = 5

        # Run full chain verification
        verification = self.flight_recorder.verify_chain()

        # Log verifier audit event
        audit_block = self.flight_recorder.record_event(
            worker_id="@verifier",
            action_type="audit_verification",
            payload={
                "event": "CRYPTOGRAPHIC_AUDIT_PASSED",
                "valid": verification.get("valid"),
                "total_blocks_verified": verification.get("total_blocks"),
                "tip_hash": self.flight_recorder.chain[-1]["block_hash"] if self.flight_recorder.chain else None,
            },
            compute_seal=True,
        )

        step_data = {
            "step": 5,
            "name": "AUDIT_VERIFIED",
            "worker": "@verifier",
            "title": "Cryptographic Ledger Verified & Audit Sealed",
            "description": "@verifier replays SHA-256 chain from genesis to tip. 100% hash chain integrity confirmed. Final Argon2id milestone proof generated.",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "data": {
                "verification": verification,
                "audit_block": audit_block,
                "total_blocks": len(self.flight_recorder.chain),
                "argon2_milestones": [
                    b["index"] for b in self.flight_recorder.chain if b.get("argon2_seal")
                ],
            },
        }

        self.step_history.append(step_data)
        self.last_result = step_data
        return step_data

    def run_step(self, step: int) -> Dict[str, Any]:
        """Executes a single step by number (1 to 5)."""
        if step == 1:
            return self.run_step_1_lock_contract()
        elif step == 2:
            return self.run_step_2_backend_drift()
        elif step == 3:
            return self.run_step_3_frontend_collision()
        elif step == 4:
            return self.run_step_4_intercept_and_analyze()
        elif step == 5:
            return self.run_step_5_verify_ledger()
        else:
            raise ValueError(f"Invalid demo step {step}. Valid steps are 1 to 5.")

    def run_full_demo(
        self,
        event_callback: Optional[Callable[[Dict[str, Any]], None]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Executes all 5 steps of the demo scenario sequentially.
        Calls optional event_callback(step_data) after each step if provided.
        """
        self.reset_demo()
        self.is_running = True
        results = []

        try:
            for s in range(1, 6):
                step_res = self.run_step(s)
                results.append(step_res)
                if event_callback is not None:
                    try:
                        event_callback(step_res)
                    except Exception:
                        pass
        finally:
            self.is_running = False

        return results
