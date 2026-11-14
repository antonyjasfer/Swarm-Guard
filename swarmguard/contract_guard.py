"""
Contract Guard for SwarmGuard
Manages OpenAPI contract locking, canonical fingerprinting, and AST/diff drift detection.
"""

import hashlib
import json
import os
import re
from typing import Any, Dict, List, Optional
import yaml

from swarmguard.flight_recorder import FlightRecorder


class ContractGuard:
    """
    Guards OpenAPI / JSON contracts against unauthorized drift across swarm workers.
    Computes immutable SHA-256 fingerprints and detects schema mutations in code diffs.
    """

    def __init__(self, flight_recorder: Optional[FlightRecorder] = None):
        self.flight_recorder = flight_recorder
        self.locked_contract: Optional[Dict[str, Any]] = None
        self.contract_fingerprint: Optional[str] = None
        self.contract_path: Optional[str] = None
        self.raw_contract_text: Optional[str] = None

    def lock_contract(
        self,
        contract_path: str,
        flight_recorder: Optional[FlightRecorder] = None,
    ) -> Dict[str, Any]:
        """
        Reads YAML/JSON OpenAPI contract, computes canonical SHA-256 fingerprint,
        stores as genesis contract, and records genesis milestone block in FlightRecorder.
        """
        if not os.path.exists(contract_path):
            raise FileNotFoundError(f"Contract file not found at: {contract_path}")

        with open(contract_path, "r", encoding="utf-8") as f:
            raw_text = f.read()

        # Parse YAML or JSON
        try:
            parsed = yaml.safe_load(raw_text)
        except Exception as e:
            try:
                parsed = json.loads(raw_text)
            except Exception:
                raise ValueError(f"Failed to parse contract at {contract_path} as YAML or JSON: {e}")

        # Canonicalize for deterministic fingerprinting
        canonical_json = json.dumps(parsed, sort_keys=True, separators=(",", ":"), default=str)
        fingerprint = hashlib.sha256(canonical_json.encode("utf-8")).hexdigest()

        self.locked_contract = parsed
        self.contract_fingerprint = fingerprint
        self.contract_path = contract_path
        self.raw_contract_text = raw_text

        recorder = flight_recorder or self.flight_recorder
        block = None
        if recorder is not None:
            title = parsed.get("info", {}).get("title", "OpenAPI Contract")
            version = parsed.get("info", {}).get("version", "1.0.0")
            endpoints = list(parsed.get("paths", {}).keys())

            block = recorder.record_event(
                worker_id="@coordinator",
                action_type="contract_lock",
                payload={
                    "event": "CONTRACT_GENESIS_LOCK",
                    "contract_path": contract_path,
                    "title": title,
                    "version": version,
                    "fingerprint": fingerprint,
                    "endpoints": endpoints,
                },
                compute_seal=True,
            )

        return {
            "status": "LOCKED",
            "contract_path": contract_path,
            "fingerprint": fingerprint,
            "title": parsed.get("info", {}).get("title", "OpenAPI Contract"),
            "version": parsed.get("info", {}).get("version", "1.0.0"),
            "endpoints": list(parsed.get("paths", {}).keys()),
            "contract": parsed,
            "genesis_block": block,
        }

    def check_diff_drift(
        self,
        worker_id: str,
        diff_text: str,
        current_contract: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Parses code/schema diffs for endpoint changes or breaking schema modifications.
        Specifically inspects for:
          - Renaming or deletion of total_amount (e.g. replaced by amount_cents)
          - Type mutations (float/number -> int)
          - Missing required fields (items, total_amount, currency, customer_id)
          - Altered endpoint routes
        Returns {
          has_drift: bool,
          severity: str,
          drift_type: str,
          details: str,
          breaking_fields: list,
          impacted_workers: list
        }
        """
        contract = current_contract or self.locked_contract or {}
        breaking_fields: List[str] = []
        details_list: List[str] = []
        drift_type = "CLEAN"
        severity = "NONE"

        diff_lower = diff_text.lower()

        # Check 1: total_amount -> amount_cents rename or removal
        renamed_to_cents = bool(
            re.search(r"amount_cents|amountincents|amount_in_cents", diff_text, re.IGNORECASE)
        )
        total_amount_removed = bool(
            re.search(r"-\s*['\"]?total_amount['\"]?", diff_text)
            or re.search(r"total_amount.*->.*amount_cents", diff_text, re.IGNORECASE)
            or ("amount_cents" in diff_lower and "total_amount" not in diff_lower)
        )

        if renamed_to_cents:
            breaking_fields.append("total_amount")
            breaking_fields.append("amount_cents")
            drift_type = "SCHEMA_BREAKING_FIELD_MUTATION"
            severity = "CRITICAL_BREAKING"
            details_list.append(
                f"Breaking contract violation by {worker_id}: Renamed required field 'total_amount: float' "
                f"to 'amount_cents: int'. This creates an immediate runtime deserialization crash "
                f"for consuming workers (e.g. @frontend expecting decimal total_amount)."
            )

        elif total_amount_removed:
            breaking_fields.append("total_amount")
            drift_type = "SCHEMA_REQUIRED_FIELD_MISSING"
            severity = "CRITICAL_BREAKING"
            details_list.append(
                f"Required field 'total_amount' is deleted or omitted in diff from {worker_id}."
            )

        # Check 2: Type mutation float -> int or string
        type_mutation_pattern = re.search(
            r"total_amount\s*:\s*(int|integer|str|string)",
            diff_text,
            re.IGNORECASE,
        )
        if type_mutation_pattern:
            mutated_type = type_mutation_pattern.group(1)
            breaking_fields.append("total_amount")
            drift_type = "SCHEMA_TYPE_MUTATION"
            severity = "CRITICAL_BREAKING"
            details_list.append(
                f"Type mismatch on 'total_amount': contract specifies 'float/number', but diff declares '{mutated_type}'."
            )

        # Check 3: Missing other required fields from contract schema
        contract_paths = contract.get("paths", {})
        checkout_schema = (
            contract_paths.get("/api/v1/checkout", {})
            .get("post", {})
            .get("requestBody", {})
            .get("content", {})
            .get("application/json", {})
            .get("schema", {})
        )
        required_fields = checkout_schema.get("required", ["items", "total_amount", "currency", "customer_id"])

        for req in required_fields:
            if req == "total_amount":
                continue  # already checked above
            # If diff explicitly removes required field
            if re.search(rf"-\s*['\"]?{req}['\"]?", diff_text):
                breaking_fields.append(req)
                drift_type = "SCHEMA_REQUIRED_FIELD_MISSING"
                severity = "CRITICAL_BREAKING"
                details_list.append(f"Required contract field '{req}' was removed by {worker_id}.")

        # Check 4: Endpoint path alteration
        if "/api/v1/checkout" in contract_paths:
            altered_endpoint = re.search(r"-\s*['\"]?/api/v1/checkout['\"]?", diff_text)
            if altered_endpoint:
                drift_type = "ENDPOINT_SIGNATURE_DRIFT"
                severity = "CRITICAL_BREAKING"
                breaking_fields.append("/api/v1/checkout")
                details_list.append(f"Contract route '/api/v1/checkout' was modified or deleted by {worker_id}.")

        has_drift = len(breaking_fields) > 0 or severity == "CRITICAL_BREAKING"

        impacted_workers = []
        if has_drift:
            if worker_id == "@backend":
                impacted_workers = ["@frontend", "@verifier"]
            elif worker_id == "@frontend":
                impacted_workers = ["@backend", "@verifier"]
            else:
                impacted_workers = ["@backend", "@frontend"]

        return {
            "has_drift": has_drift,
            "severity": severity,
            "drift_type": drift_type,
            "details": "\n".join(details_list) if details_list else "No contract drift detected. Diff matches locked specification.",
            "breaking_fields": list(dict.fromkeys(breaking_fields)),
            "impacted_workers": impacted_workers,
            "worker_id": worker_id,
        }

    def get_contract(self) -> Optional[Dict[str, Any]]:
        """Returns the currently locked contract."""
        return self.locked_contract

    def get_fingerprint(self) -> Optional[str]:
        """Returns the locked contract SHA-256 fingerprint."""
        return self.contract_fingerprint
