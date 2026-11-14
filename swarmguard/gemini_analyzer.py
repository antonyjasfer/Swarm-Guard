"""
Gemini 2.5 Flash Analyzer for SwarmGuard
Analyzes contract diff collisions and auto-generates structured remediation
prompts for swarm workers (@backend, @frontend) using the google-genai SDK
with a deterministic high-fidelity offline fallback.
"""

import json
import os
from typing import Any, Dict, Optional


class GeminiAnalyzer:
    """
    Leverages Gemini 2.5 Flash to conduct semantic analysis of breaking contract
    drift and generate zero-drift remediation instructions.
    """

    MODEL_NAME = "gemini-2.5-flash"

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = (
            api_key
            or os.environ.get("GEMINI_API_KEY")
            or os.environ.get("GOOGLE_API_KEY")
        )
        self.client = None
        self._init_client()

    def _init_client(self) -> None:
        if self.api_key:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
            except Exception:
                self.client = None

    def analyze_drift(
        self,
        worker_id: str,
        diff_text: str,
        drift_info: Dict[str, Any],
        contract_summary: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Generates structured remediation analysis. Attempts live Gemini 2.5 Flash call first;
        if key is missing or call fails, gracefully executes deterministic fallback.
        """
        if self.client is not None:
            try:
                return self._call_gemini_api(worker_id, diff_text, drift_info, contract_summary)
            except Exception as e:
                # Fall through to deterministic heuristic
                pass

        return self._heuristic_fallback(worker_id, diff_text, drift_info, contract_summary)

    def _call_gemini_api(
        self,
        worker_id: str,
        diff_text: str,
        drift_info: Dict[str, Any],
        contract_summary: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Calls Gemini 2.5 Flash with structured output instructions."""
        prompt = f"""
You are the SwarmGuard AI Safety & Contract Verification Engine.
A multi-agent swarm collision occurred where worker {worker_id} pushed a diff that violates a locked OpenAPI contract.

CONTRACT SUMMARY:
{json.dumps(contract_summary or {}, indent=2)}

DETECTED DRIFT:
Severity: {drift_info.get('severity')}
Drift Type: {drift_info.get('drift_type')}
Breaking Fields: {drift_info.get('breaking_fields')}
Details: {drift_info.get('details')}

CODE/SCHEMA DIFF:
```
{diff_text}
```

TASK:
Analyze the breaking collision and provide structured JSON response with:
1. "summary": One-sentence root cause explanation.
2. "breaking_impact": Concrete runtime failure impact (e.g. 422 Unprocessable Entity, deserialization failure).
3. "remediation_patch": Recommended code snippet to restore contract compliance.
4. "backend_prompt": Specific directive addressed to @backend.
5. "frontend_prompt": Specific directive addressed to @frontend.
6. "recommended_action": "REVERT_AND_ALIGN" or "MIGRATE_WITH_DEPRECATION_WINDOW".

Output strictly valid JSON with no markdown wrapping.
"""
        response = self.client.models.generate_content(
            model=self.MODEL_NAME,
            contents=prompt,
        )

        raw_text = response.text.strip()
        # Clean potential markdown fences
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:]
        if raw_text.startswith("```"):
            raw_text = raw_text[3:]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]

        parsed = json.loads(raw_text.strip())
        parsed["analyzer"] = "gemini-2.5-flash"
        parsed["live_api"] = True
        return parsed

    def _heuristic_fallback(
        self,
        worker_id: str,
        diff_text: str,
        drift_info: Dict[str, Any],
        contract_summary: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        High-fidelity deterministic fallback generating complete remediation advice
        when Gemini API key is absent or offline.
        """
        breaking_fields = drift_info.get("breaking_fields", [])
        is_cents_rename = "amount_cents" in breaking_fields or "amount_cents" in diff_text.lower()

        if is_cents_rename:
            summary = (
                f"Contract drift detected: {worker_id} altered the '/api/v1/checkout' request schema, "
                f"renaming locked field 'total_amount: float' to 'amount_cents: int'."
            )
            breaking_impact = (
                "@frontend sends payload expecting { items, total_amount, currency, customer_id }. "
                "Backend service will reject client requests with HTTP 422 Unprocessable Entity "
                "(missing required field 'amount_cents' and unexpected field 'total_amount')."
            )
            remediation_patch = (
                "# RESTORE CONTRACT COMPLIANCE IN FastAPI/Pydantic:\n"
                "class CheckoutRequest(BaseModel):\n"
                "    items: List[CheckoutItem]\n"
                "    total_amount: float  # Required by locked contract\n"
                "    currency: str = 'USD'\n"
                "    customer_id: str\n\n"
                "    @property\n"
                "    def amount_cents(self) -> int:\n"
                "        # Internal helper for integer-based payment gateways without breaking the wire contract\n"
                "        return int(round(self.total_amount * 100))\n"
            )
            backend_prompt = (
                f"{worker_id} CRITICAL: Revert the field rename from 'amount_cents' back to 'total_amount: float'. "
                "The OpenAPI contract is cryptographically locked by @coordinator. If your internal logic "
                "requires integer cents, compute it internally via a model property `@property def amount_cents` "
                "instead of mutating the public contract."
            )
            frontend_prompt = (
                "@frontend CONTRACT NOTICE: Continue transmitting 'total_amount' as a decimal float (e.g. 99.50). "
                "The backend attempt to switch to 'amount_cents' has been intercepted by SwarmGuard Policy Gate."
            )
        else:
            summary = (
                f"Contract drift detected: {worker_id} introduced changes affecting fields: "
                f"{', '.join(breaking_fields) if breaking_fields else 'unknown'}."
            )
            breaking_impact = (
                "Schema incompatibility between backend API specification and consuming client workers. "
                "Causes serialization errors or missing payload properties."
            )
            remediation_patch = (
                "# Ensure all schema fields match OpenAPI 3.1 contract:\n"
                "# Verify field names, optionality, and scalar types match checkout_contract.yaml\n"
            )
            backend_prompt = (
                f"{worker_id} NOTICE: SwarmGuard detected breaking contract drift ({drift_info.get('drift_type')}). "
                "Please review `contracts/checkout_contract.yaml` and realign your implementation."
            )
            frontend_prompt = (
                "@frontend NOTICE: A backend drift was intercepted. Do not alter client request schemas until "
                "an authorized migration is approved."
            )

        return {
            "summary": summary,
            "breaking_impact": breaking_impact,
            "remediation_patch": remediation_patch,
            "backend_prompt": backend_prompt,
            "frontend_prompt": frontend_prompt,
            "recommended_action": "REVERT_AND_ALIGN",
            "analyzer": "swarmguard-heuristic-fallback",
            "live_api": False,
        }
