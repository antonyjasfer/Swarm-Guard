"""
SwarmGuard FastAPI Application
Exposes REST APIs, WebSocket real-time telemetry, and serves the
Mission Control React dashboard for Antigravity swarms and Cloud Run deployment.
"""

import asyncio
from datetime import datetime, timezone
import json
import os
from typing import Any, Dict, List, Optional, Set

from fastapi import Body, FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, PlainTextResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from swarmguard.contract_guard import ContractGuard
from swarmguard.demo_scenarios import BACKEND_BREAKING_DIFF, DemoScenarioRunner
from swarmguard.flight_recorder import FlightRecorder
from swarmguard.gemini_analyzer import GeminiAnalyzer
from swarmguard.policy_gate import GateState, PolicyGate


# ---------------------------------------------------------
# App Initialization & Singletons
# ---------------------------------------------------------

app = FastAPI(
    title="SwarmGuard API",
    description="Zero-Drift Contract Verifier, Smart Policy Gate & Cryptographic Flight Recorder for Antigravity swarms",
    version="0.1.0",
)

# CORS Middleware for seamless local Vite development & Cloud Run
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core singletons
flight_recorder = FlightRecorder()
contract_guard = ContractGuard(flight_recorder=flight_recorder)
gemini_analyzer = GeminiAnalyzer()
policy_gate = PolicyGate(
    flight_recorder=flight_recorder,
    contract_guard=contract_guard,
    gemini_analyzer=gemini_analyzer,
)

# Demo Runner
demo_runner = DemoScenarioRunner(
    flight_recorder=flight_recorder,
    contract_guard=contract_guard,
    gemini_analyzer=gemini_analyzer,
    policy_gate=policy_gate,
)

# Active drift events history
drift_events_store: List[Dict[str, Any]] = []


# ---------------------------------------------------------
# WebSocket Connection Manager
# ---------------------------------------------------------

class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)

    async def broadcast(self, message: Dict[str, Any]):
        if not self.active_connections:
            return
        dead = []
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                dead.append(connection)
        for d in dead:
            self.active_connections.discard(d)


ws_manager = ConnectionManager()


def sync_broadcast(message: Dict[str, Any]):
    """Helper to broadcast WebSocket events from sync demo runner code."""
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(ws_manager.broadcast(message))
    except RuntimeError:
        pass


# ---------------------------------------------------------
# Formatting Helpers for Mission Control Parity
# ---------------------------------------------------------

def format_contract_info() -> Dict[str, Any]:
    locked_contract = contract_guard.get_contract()
    fingerprint = contract_guard.get_fingerprint()

    if locked_contract:
        title = locked_contract.get("info", {}).get("title", "E-Commerce Checkout API")
        version = locked_contract.get("info", {}).get("version", "1.0.0")
        endpoints = list(locked_contract.get("paths", {}).keys())
        first_endpoint = endpoints[0] if endpoints else "/api/v1/checkout"
        spec_snippet = contract_guard.raw_contract_text or json.dumps(locked_contract, indent=2)

        return {
            "name": title,
            "version": f"OpenAPI {locked_contract.get('openapi', '3.1.0')}",
            "hash": fingerprint or "0" * 64,
            "locked_at": flight_recorder.chain[0]["timestamp"] if flight_recorder.chain else datetime.now(timezone.utc).isoformat(),
            "endpoint": first_endpoint,
            "spec_snippet": spec_snippet[:1200],
            "status": "LOCKED",
            "fingerprint": fingerprint,
            "contract": locked_contract,
        }

    return {
        "name": "E-Commerce Checkout API",
        "version": "OpenAPI 3.1.0",
        "hash": "0" * 64,
        "locked_at": datetime.now(timezone.utc).isoformat(),
        "endpoint": "/api/v1/checkout",
        "spec_snippet": "# No contract locked yet. Lock checkout_contract.yaml to begin.",
        "status": "UNLOCKED",
        "fingerprint": None,
        "contract": None,
    }


def format_gate_state() -> Dict[str, Any]:
    status = policy_gate.get_status()
    latest_override = status.get("latest_override")
    active_incident = None

    if drift_events_store:
        active_incident = drift_events_store[0]

    return {
        "state": status.get("state", GateState.VERIFIED_CLEAN),
        "active_incident": active_incident,
        "last_updated": datetime.now(timezone.utc).isoformat(),
        "operator_action": latest_override.get("reason") if latest_override else None,
        "operator_id": latest_override.get("operator_id") if latest_override else None,
        "argon2_seal": latest_override.get("argon2_seal") if latest_override else None,
    }


def format_verification() -> Dict[str, Any]:
    verify_res = flight_recorder.verify_chain()
    return {
        "valid": verify_res.get("valid", True),
        "tampered_block_index": verify_res.get("tampered_block_index"),
        "total_blocks": len(flight_recorder.chain),
        "chain": flight_recorder.chain,
        "algorithm": "SHA-256 + Argon2id",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "reason": verify_res.get("reason"),
    }


def format_demo_state() -> Dict[str, Any]:
    state = demo_runner.get_demo_state()
    step = state.get("current_step", 0)

    titles = {
        0: "Baseline Initialization",
        1: "Step 1: Baseline Clean Contract Locked & Sealed",
        2: "Step 2: @backend Pushes Unauthorized Schema Mutation",
        3: "Step 3: @frontend Integrates Against Locked Contract",
        4: "Step 4: Smart Policy Gate Intercepts Breaking Drift",
        5: "Step 5: Cryptographic Ledger Verified & Audit Sealed",
    }

    status_map = {
        0: "idle",
        1: "running",
        2: "running",
        3: "running",
        4: "blocked",
        5: "completed",
    }

    logs = []
    for item in state.get("step_history", []):
        logs.append(f"[{item.get('worker')}] {item.get('description')}")

    if not logs:
        logs.append("SwarmGuard initialized. Ready to execute multi-agent collision scenario.")

    return {
        "current_step": step,
        "total_steps": 5,
        "step_title": titles.get(step, f"Step {step}"),
        "status": status_map.get(step, "idle"),
        "logs": logs,
    }


def create_drift_event(worker_id: str, diff_text: str, drift: Dict[str, Any], analysis: Dict[str, Any]) -> Dict[str, Any]:
    event_id = f"drift-evt-{int(datetime.now(timezone.utc).timestamp() * 1000)}"

    gemini_formatted = {
        "summary": analysis.get("summary", "Contract drift detected"),
        "severity": drift.get("severity", "CRITICAL_BREAKING"),
        "impacted_workers": drift.get("impacted_workers", ["@frontend", "@verifier"]),
        "root_cause": analysis.get("breaking_impact", "Schema mismatch between backend diff and contract"),
        "suggested_fix_prompt": analysis.get("backend_prompt", "Revert schema mutation"),
        "suggested_patch": analysis.get("remediation_patch", ""),
    }

    drift_event = {
        "id": event_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "worker_id": worker_id,
        "has_drift": drift.get("has_drift", True),
        "severity": drift.get("severity", "CRITICAL_BREAKING"),
        "drift_type": drift.get("drift_type", "SCHEMA_BREAKING_FIELD_MUTATION"),
        "details": drift.get("details", ""),
        "breaking_fields": drift.get("breaking_fields", []),
        "diff_text": diff_text,
        "expected_snippet": """// Locked Contract (checkout_contract.yaml)
{
  "total_amount": 149.99,
  "currency": "USD",
  "customer_id": "cust_8820"
}""",
        "actual_snippet": """// Offending Worker Diff (@backend)
{
  "amount_cents": 14999, // BREAKING: renamed from total_amount: float
  "currency": "USD",
  "customer_id": "cust_8820"
}""",
        "gemini_analysis": gemini_formatted,
    }

    drift_events_store.insert(0, drift_event)
    return drift_event


# ---------------------------------------------------------
# Request Models
# ---------------------------------------------------------

class ContractLockRequest(BaseModel):
    spec_path: Optional[str] = "contracts/checkout_contract.yaml"
    contract_path: Optional[str] = None


class DriftCheckRequest(BaseModel):
    worker_id: str = "@backend"
    diff_text: str = Field(default=BACKEND_BREAKING_DIFF)
    action_type: str = "file_diff"


class GateActionRequest(BaseModel):
    action: str = Field(description="APPROVE_OVERRIDE, REJECT_ROLLBACK, APPLY_FIX, approve, reject")
    operator_id: str = "human_operator_01"
    reason: str = "Audited via SwarmGuard Mission Control"


class TamperRequest(BaseModel):
    index: int = 1
    payload: Optional[Any] = "MALICIOUS_INJECTED_OVERRIDE_TAMPER"
    new_payload: Optional[Any] = None


class DemoRunRequest(BaseModel):
    step: Optional[int] = None


# ---------------------------------------------------------
# Lifecycle / Startup Initialization
# ---------------------------------------------------------

@app.on_event("startup")
async def startup_event():
    """Initializes the demo baseline with contracts/checkout_contract.yaml on server start."""
    contract_path = os.path.join(os.getcwd(), "contracts", "checkout_contract.yaml")
    if os.path.exists(contract_path):
        try:
            # Run steps 1 to 4 so Mission Control opens with the collision scenario preloaded
            demo_runner.run_step_1_lock_contract()
            demo_runner.run_step_2_backend_drift()
            demo_runner.run_step_3_frontend_collision()
            step_4 = demo_runner.run_step_4_intercept_and_analyze()

            # Store the drift event for UI feed
            s4_data = step_4.get("data", {})
            create_drift_event(
                worker_id="@backend",
                diff_text=BACKEND_BREAKING_DIFF,
                drift=s4_data.get("drift", {}),
                analysis=s4_data.get("analysis", {}),
            )
        except Exception as e:
            print(f"[SwarmGuard Startup] Warning: could not initialize default demo scenario: {e}")


# ---------------------------------------------------------
# Health Check Endpoint
# ---------------------------------------------------------

@app.get("/healthz")
async def healthz():
    return {
        "status": "ok",
        "service": "swarmguard",
        "version": "0.1.0",
        "contract_locked": contract_guard.locked_contract is not None,
        "ledger_blocks": len(flight_recorder.chain),
        "gate_state": policy_gate.state,
    }


# ---------------------------------------------------------
# Contract Endpoints
# ---------------------------------------------------------

@app.get("/api/contract")
async def get_contract():
    return format_contract_info()


@app.post("/api/contract/lock")
async def lock_contract(req: ContractLockRequest = Body(default_factory=ContractLockRequest)):
    path_to_lock = req.contract_path or req.spec_path or "contracts/checkout_contract.yaml"
    resolved_path = os.path.abspath(path_to_lock)

    if not os.path.exists(resolved_path):
        # Check relative to cwd
        alt = os.path.join(os.getcwd(), path_to_lock)
        if os.path.exists(alt):
            resolved_path = alt
        else:
            raise HTTPException(status_code=404, detail=f"Contract file not found at: {path_to_lock}")

    res = contract_guard.lock_contract(resolved_path, flight_recorder=flight_recorder)
    contract_info = format_contract_info()

    if res.get("genesis_block"):
        await ws_manager.broadcast({
            "type": "NEW_BLOCK",
            "block": res["genesis_block"],
        })

    await ws_manager.broadcast({
        "type": "GATE_STATE_CHANGE",
        "gate": format_gate_state(),
    })

    return {
        "success": True,
        "status": "LOCKED",
        "contract": contract_info,
        "fingerprint": res.get("fingerprint"),
        "genesis_block": res.get("genesis_block"),
    }


# ---------------------------------------------------------
# Drift Detection Endpoints
# ---------------------------------------------------------

@app.get("/api/drift/events")
async def get_drift_events():
    return drift_events_store


@app.post("/api/drift/check")
async def check_drift(req: DriftCheckRequest):
    drift = contract_guard.check_diff_drift(worker_id=req.worker_id, diff_text=req.diff_text)
    gate_res = policy_gate.evaluate_action(
        worker_id=req.worker_id,
        action_type=req.action_type,
        diff_text=req.diff_text,
        contract_guard=contract_guard,
        flight_recorder=flight_recorder,
        gemini_analyzer=gemini_analyzer,
    )

    analysis = gate_res.get("analysis", {})
    drift_event = None

    if drift.get("has_drift"):
        drift_event = create_drift_event(
            worker_id=req.worker_id,
            diff_text=req.diff_text,
            drift=drift,
            analysis=analysis,
        )

        if gate_res.get("block"):
            await ws_manager.broadcast({
                "type": "NEW_BLOCK",
                "block": gate_res["block"],
            })

        await ws_manager.broadcast({
            "type": "DRIFT_DETECTED",
            "drift": drift_event,
        })

        await ws_manager.broadcast({
            "type": "GATE_STATE_CHANGE",
            "gate": format_gate_state(),
        })

    return {
        "has_drift": drift.get("has_drift", False),
        "severity": drift.get("severity"),
        "drift_type": drift.get("drift_type"),
        "gate_state": gate_res.get("state"),
        "blocked": gate_res.get("blocked"),
        "drift": drift,
        "analysis": analysis,
        "drift_event": drift_event,
    }


# ---------------------------------------------------------
# Cryptographic Flight Recorder Ledger Endpoints
# ---------------------------------------------------------

@app.get("/api/ledger")
async def get_ledger():
    return {
        "total_blocks": len(flight_recorder.chain),
        "valid": flight_recorder.verify_chain().get("valid", True),
        "chain": flight_recorder.chain,
    }


@app.api_route("/api/ledger/verify", methods=["GET", "POST"])
async def verify_ledger():
    result = format_verification()
    await ws_manager.broadcast({
        "type": "LEDGER_VERIFIED",
        "verification": result,
    })
    return result


@app.post("/api/ledger/tamper")
async def tamper_ledger(req: TamperRequest):
    index = req.index
    payload = req.new_payload if req.new_payload is not None else req.payload

    if index < 0 or index >= len(flight_recorder.chain):
        raise HTTPException(
            status_code=400,
            detail=f"Block index {index} out of bounds (chain length {len(flight_recorder.chain)})",
        )

    tampered_block = flight_recorder.tamper_block(index, payload)
    verification = format_verification()

    await ws_manager.broadcast({
        "type": "LEDGER_TAMPERED",
        "tampered_block": tampered_block,
        "verification": verification,
    })

    return {
        "tampered_block": tampered_block,
        "verification": verification,
        "valid": verification["valid"],
        "tampered_block_index": verification["tampered_block_index"],
        "total_blocks": verification["total_blocks"],
    }


@app.get("/api/ledger/export")
async def export_ledger():
    export_data = flight_recorder.export_ledger()
    return JSONResponse(
        content=export_data,
        headers={"Content-Disposition": f"attachment; filename=swarmguard-ledger-{int(datetime.now(timezone.utc).timestamp())}.json"},
    )


# ---------------------------------------------------------
# Smart Policy Gate Endpoints
# ---------------------------------------------------------

@app.get("/api/gate/status")
async def get_gate_status():
    return format_gate_state()


@app.post("/api/gate/action")
async def handle_gate_action(req: GateActionRequest):
    action = req.action.upper()

    if action in ["APPROVE_OVERRIDE", "APPROVE"]:
        res = policy_gate.approve_override(
            operator_id=req.operator_id,
            reason=req.reason,
            flight_recorder=flight_recorder,
        )
        if res.get("block"):
            await ws_manager.broadcast({
                "type": "NEW_BLOCK",
                "block": res["block"],
            })

    elif action in ["REJECT_ROLLBACK", "REJECT", "ROLLBACK"]:
        res = policy_gate.reject_and_rollback(
            worker_id="@backend",
            flight_recorder=flight_recorder,
        )
        if res.get("block"):
            await ws_manager.broadcast({
                "type": "NEW_BLOCK",
                "block": res["block"],
            })

    elif action in ["APPLY_FIX"]:
        policy_gate.reset()
        drift_events_store.clear()
        fix_block = flight_recorder.record_event(
            worker_id="@backend",
            action_type="gemini_fix_applied",
            payload={
                "event": "REMEDIATION_PATCH_APPLIED",
                "operator_id": req.operator_id,
                "reason": req.reason,
            },
            compute_seal=False,
        )
        await ws_manager.broadcast({
            "type": "NEW_BLOCK",
            "block": fix_block,
        })

    else:
        raise HTTPException(status_code=400, detail=f"Unsupported gate action: {req.action}")

    gate_formatted = format_gate_state()
    await ws_manager.broadcast({
        "type": "GATE_STATE_CHANGE",
        "gate": gate_formatted,
    })

    return gate_formatted


# ---------------------------------------------------------
# Demo Scenario Simulation Endpoints
# ---------------------------------------------------------

@app.get("/api/demo/state")
async def get_demo_state():
    return format_demo_state()


@app.post("/api/demo/run")
async def run_demo(req: DemoRunRequest = Body(default_factory=DemoRunRequest)):
    step = req.step

    if step is not None:
        if step < 1 or step > 5:
            raise HTTPException(status_code=400, detail="Demo step must be between 1 and 5.")

        step_res = demo_runner.run_step(step)

        # Broadcast newly created blocks
        data = step_res.get("data", {})
        if "block" in data and data["block"]:
            await ws_manager.broadcast({"type": "NEW_BLOCK", "block": data["block"]})
        if "genesis_block" in data and data["genesis_block"]:
            await ws_manager.broadcast({"type": "NEW_BLOCK", "block": data["genesis_block"]})
        if "audit_block" in data and data["audit_block"]:
            await ws_manager.broadcast({"type": "NEW_BLOCK", "block": data["audit_block"]})

        if step == 4:
            create_drift_event(
                worker_id="@backend",
                diff_text=BACKEND_BREAKING_DIFF,
                drift=data.get("drift", {}),
                analysis=data.get("analysis", {}),
            )
            await ws_manager.broadcast({
                "type": "DRIFT_DETECTED",
                "drift": drift_events_store[0],
            })

        demo_formatted = format_demo_state()
        await ws_manager.broadcast({
            "type": "DEMO_UPDATE",
            "demo": demo_formatted,
        })
        await ws_manager.broadcast({
            "type": "GATE_STATE_CHANGE",
            "gate": format_gate_state(),
        })

        return demo_formatted

    # Full demo run (all 5 steps)
    drift_events_store.clear()

    def step_notifier(step_data):
        d = step_data.get("data", {})
        if "block" in d and d["block"]:
            sync_broadcast({"type": "NEW_BLOCK", "block": d["block"]})
        if "genesis_block" in d and d["genesis_block"]:
            sync_broadcast({"type": "NEW_BLOCK", "block": d["genesis_block"]})
        if "audit_block" in d and d["audit_block"]:
            sync_broadcast({"type": "NEW_BLOCK", "block": d["audit_block"]})

        if step_data.get("step") == 4:
            evt = create_drift_event(
                worker_id="@backend",
                diff_text=BACKEND_BREAKING_DIFF,
                drift=d.get("drift", {}),
                analysis=d.get("analysis", {}),
            )
            sync_broadcast({"type": "DRIFT_DETECTED", "drift": evt})

        sync_broadcast({"type": "DEMO_UPDATE", "demo": format_demo_state()})
        sync_broadcast({"type": "GATE_STATE_CHANGE", "gate": format_gate_state()})

    demo_runner.run_full_demo(event_callback=step_notifier)

    demo_formatted = format_demo_state()
    await ws_manager.broadcast({
        "type": "DEMO_UPDATE",
        "demo": demo_formatted,
    })

    return demo_formatted


@app.post("/api/demo/reset")
async def reset_demo():
    drift_events_store.clear()
    demo_runner.reset_demo()

    # Re-lock baseline genesis contract so system remains functional
    demo_runner.run_step_1_lock_contract()

    demo_formatted = format_demo_state()
    gate_formatted = format_gate_state()

    await ws_manager.broadcast({
        "type": "DEMO_UPDATE",
        "demo": demo_formatted,
    })
    await ws_manager.broadcast({
        "type": "GATE_STATE_CHANGE",
        "gate": gate_formatted,
    })
    await ws_manager.broadcast({
        "type": "NEW_BLOCK",
        "block": flight_recorder.chain[0],
    })

    return {
        "success": True,
        "message": "SwarmGuard reset to clean baseline",
        "state": demo_formatted,
    }


# ---------------------------------------------------------
# WebSocket Telemetry Stream
# ---------------------------------------------------------

@app.websocket("/ws")
async def websocket_telemetry(websocket: WebSocket):
    await ws_manager.connect(websocket)

    # Immediately push initial comprehensive state snapshot
    try:
        active_drift = drift_events_store[0] if drift_events_store else None
        await websocket.send_json({
            "type": "INIT_STATE",
            "contract": format_contract_info(),
            "blocks": flight_recorder.chain,
            "verification": format_verification(),
            "gate": format_gate_state(),
            "drift": active_drift,
            "demo": format_demo_state(),
        })

        while True:
            raw_text = await websocket.receive_text()
            try:
                msg = json.loads(raw_text)
                msg_type = msg.get("type", "").upper()
                if msg_type == "PING":
                    await websocket.send_json({"type": "PONG", "timestamp": datetime.now(timezone.utc).isoformat()})
            except Exception:
                pass

    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)


# ---------------------------------------------------------
# Static File Serving & Cloud Run SPA Fallback
# ---------------------------------------------------------

dist_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")
if not os.path.exists(dist_dir):
    dist_dir = os.path.join(os.getcwd(), "frontend", "dist")

if os.path.exists(dist_dir):
    assets_dir = os.path.join(dist_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def spa_fallback(full_path: str):
        target_file = os.path.join(dist_dir, full_path)
        if full_path and os.path.isfile(target_file):
            return FileResponse(target_file)
        index_file = os.path.join(dist_dir, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return PlainTextResponse("SwarmGuard API Engine Active. Frontend dist pending build.")
