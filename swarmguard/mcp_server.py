"""
Antigravity Model Context Protocol (MCP) Server for SwarmGuard
Exposes tools for contract locking, drift checking, tool call flight recording,
cryptographic verification, and policy gate inspection over stdio transport.
"""

import json
import os
import sys
from typing import Any, Dict, Optional

from swarmguard.contract_guard import ContractGuard
from swarmguard.flight_recorder import FlightRecorder
from swarmguard.gemini_analyzer import GeminiAnalyzer
from swarmguard.policy_gate import PolicyGate

# Dynamic import supporting both MCP 2.x and FastMCP legacy
try:
    from mcp.server.mcpserver import MCPServer
    HAS_MCP = True
except ImportError:
    try:
        from mcp.server.fastmcp import FastMCP as MCPServer
        HAS_MCP = True
    except ImportError:
        MCPServer = None
        HAS_MCP = False


# Shared instances for MCP server
_flight_recorder = FlightRecorder()
_contract_guard = ContractGuard(flight_recorder=_flight_recorder)
_gemini_analyzer = GeminiAnalyzer()
_policy_gate = PolicyGate(
    flight_recorder=_flight_recorder,
    contract_guard=_contract_guard,
    gemini_analyzer=_gemini_analyzer,
)


def get_shared_instances():
    """Returns the core instances used by the MCP server."""
    return {
        "flight_recorder": _flight_recorder,
        "contract_guard": _contract_guard,
        "gemini_analyzer": _gemini_analyzer,
        "policy_gate": _policy_gate,
    }


if HAS_MCP and MCPServer is not None:
    mcp = MCPServer(
        name="SwarmGuard",
        instructions="SwarmGuard Zero-Drift Contract Verifier and Cryptographic Flight Recorder for Antigravity swarms",
    )

    @mcp.tool()
    def lock_contract(spec_path: str) -> Dict[str, Any]:
        """
        Locks an OpenAPI 3.x or JSON schema contract for the swarm.
        Computes canonical SHA-256 fingerprint, stores genesis contract,
        and records Genesis block with memory-hard Argon2id proof seal.
        """
        resolved_path = os.path.abspath(spec_path)
        if not os.path.exists(resolved_path):
            return {
                "status": "ERROR",
                "message": f"Contract specification file not found at: {resolved_path}",
            }

        try:
            res = _contract_guard.lock_contract(resolved_path, flight_recorder=_flight_recorder)
            return {
                "status": "LOCKED",
                "contract_path": resolved_path,
                "fingerprint": res.get("fingerprint"),
                "title": res.get("title"),
                "version": res.get("version"),
                "endpoints": res.get("endpoints"),
                "genesis_block_index": 0,
            }
        except Exception as e:
            return {"status": "ERROR", "message": str(e)}

    @mcp.tool()
    def record_tool_call(worker: str, tool_name: str, args: Dict[str, Any]) -> Dict[str, Any]:
        """
        Logs an agent tool call to the append-only cryptographic flight recorder.
        Chains block with SHA-256 hash linking to preceding event.
        """
        block = _flight_recorder.record_event(
            worker_id=worker,
            action_type="tool_call",
            payload={"tool_name": tool_name, "args": args},
            compute_seal=False,
        )
        return {
            "status": "RECORDED",
            "block_index": block["index"],
            "block_hash": block["block_hash"],
            "prev_hash": block["prev_hash"],
            "timestamp": block["timestamp"],
        }

    @mcp.tool()
    def check_contract_drift(worker: str, diff_text: str) -> Dict[str, Any]:
        """
        Checks a code diff or tool modification against the locked OpenAPI contract.
        Detects renamed parameters, scalar type mutations, or deleted endpoints.
        """
        drift = _contract_guard.check_diff_drift(worker_id=worker, diff_text=diff_text)
        if drift.get("has_drift"):
            # Also evaluate through policy gate to intercept breaking mutation
            gate_res = _policy_gate.evaluate_action(
                worker_id=worker,
                action_type="file_diff",
                diff_text=diff_text,
                contract_guard=_contract_guard,
                flight_recorder=_flight_recorder,
                gemini_analyzer=_gemini_analyzer,
            )
            return {
                "has_drift": True,
                "severity": drift.get("severity"),
                "drift_type": drift.get("drift_type"),
                "details": drift.get("details"),
                "breaking_fields": drift.get("breaking_fields"),
                "impacted_workers": drift.get("impacted_workers"),
                "gate_state": gate_res.get("state"),
                "remediation": gate_res.get("analysis", {}).get("summary"),
                "backend_prompt": gate_res.get("analysis", {}).get("backend_prompt"),
                "frontend_prompt": gate_res.get("analysis", {}).get("frontend_prompt"),
            }

        return {
            "has_drift": False,
            "severity": "NONE",
            "drift_type": "CLEAN",
            "details": "Code diff conforms to locked OpenAPI specification.",
            "breaking_fields": [],
            "impacted_workers": [],
            "gate_state": _policy_gate.state,
        }

    @mcp.tool()
    def verify_audit_ledger() -> Dict[str, Any]:
        """
        Recomputes and verifies the complete cryptographic hash chain from Genesis to tip.
        Returns cryptographic integrity report and tampering detection status.
        """
        verification = _flight_recorder.verify_chain()
        return {
            "valid": verification.get("valid"),
            "total_blocks": verification.get("total_blocks"),
            "tampered_block_index": verification.get("tampered_block_index"),
            "reason": verification.get("reason"),
            "tip_hash": _flight_recorder.chain[-1]["block_hash"] if _flight_recorder.chain else None,
            "argon2_milestones_count": len([
                b for b in _flight_recorder.chain if b.get("argon2_seal")
            ]),
        }

    @mcp.tool()
    def get_gate_status() -> Dict[str, Any]:
        """
        Returns the current Smart Policy Gate status, including active intercepted drift
        and override audit history.
        """
        return _policy_gate.get_status()

else:
    mcp = None


def run_stdio_server():
    """Runs the MCP server over stdio transport."""
    if mcp is not None:
        mcp.run(transport="stdio")
    else:
        sys.stderr.write("MCP package not installed; cannot start stdio server.\n")
        sys.exit(1)


if __name__ == "__main__":
    run_stdio_server()
