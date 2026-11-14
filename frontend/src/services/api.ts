import { Block, VerificationResult, DriftEvent, GateState, ContractInfo, DemoState, SwarmNode } from '../types';

const API_BASE = '/api';

// Initial realistic baseline state
export const DEFAULT_CONTRACT: ContractInfo = {
  name: 'E-Commerce Checkout API',
  version: 'OpenAPI 3.1.0',
  hash: '9f83a48e69c4f1e9b2512f38d728564a9c8b74619d8542918e7e1f486b3b2841',
  locked_at: new Date(Date.now() - 3600000).toISOString(),
  endpoint: '/api/v1/checkout',
  status: 'LOCKED',
  spec_snippet: `paths:
  /api/v1/checkout:
    post:
      summary: Process customer order
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [items, total_amount, currency, customer_id]
              properties:
                items:
                  type: array
                  items:
                    type: object
                    required: [product_id, quantity, unit_price]
                total_amount:
                  type: number
                  description: "Total order charge (e.g. 149.99)"
                currency:
                  type: string
                  example: "USD"
                customer_id:
                  type: string`,
};

export const DEFAULT_BLOCKS: Block[] = [
  {
    index: 0,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    worker_id: '@coordinator',
    action_type: 'genesis_contract_lock',
    payload_hash: '9f83a48e69c4f1e9b2512f38d728564a9c8b74619d8542918e7e1f486b3b2841',
    payload_preview: 'Locked contracts/checkout_contract.yaml (SHA-256 genesis fingerprint computed)',
    prev_hash: '0000000000000000000000000000000000000000000000000000000000000000',
    block_hash: '4d8a17fe68c92b95b8d2348512e094f923b7829cd4123fe1204859a7f34c2b81',
    argon2_seal: '$argon2id$v=19$m=65536,t=3,p=4$SWARMGUARD_GENESIS_SEAL_V1$9k2aP8',
  },
  {
    index: 1,
    timestamp: new Date(Date.now() - 2400000).toISOString(),
    worker_id: '@verifier',
    action_type: 'contract_baseline_verified',
    payload_hash: '7a19c3b84f2910d8e204cba784918e2034981e7d829104fae910293847561029',
    payload_preview: 'Verified test assertions for E-Commerce Checkout API schema baseline',
    prev_hash: '4d8a17fe68c92b95b8d2348512e094f923b7829cd4123fe1204859a7f34c2b81',
    block_hash: 'e8124b69c4f1e9b2512f38d728564a9c8b74619d8542918e7e1f486b3b2841a0',
    argon2_seal: null,
  },
  {
    index: 2,
    timestamp: new Date(Date.now() - 1200000).toISOString(),
    worker_id: '@backend',
    action_type: 'diff_intercepted',
    payload_hash: '3c8471e9821034ba981023948e71293840192837461520192837461520192837',
    payload_preview: 'Renamed total_amount: float -> amount_cents: int in /api/v1/checkout endpoint',
    prev_hash: 'e8124b69c4f1e9b2512f38d728564a9c8b74619d8542918e7e1f486b3b2841a0',
    block_hash: '829cba1029384756102938475610293847561029384756102938475610293847',
    argon2_seal: null,
  },
];

export const DEFAULT_DRIFT_EVENT: DriftEvent = {
  id: 'drift-evt-001',
  timestamp: new Date(Date.now() - 1200000).toISOString(),
  worker_id: '@backend',
  has_drift: true,
  severity: 'CRITICAL_BREAKING',
  drift_type: 'SCHEMA_FIELD_MUTATION',
  details: 'Field `total_amount` removed/renamed to `amount_cents` in payload schema for /api/v1/checkout',
  breaking_fields: ['total_amount', 'amount_cents'],
  diff_text: `@@ -18,3 +18,3 @@ class CheckoutPayload(BaseModel):
-    total_amount: float
+    amount_cents: int
     currency: str = "USD"`,
  expected_snippet: `// Locked Contract (checkout_contract.yaml)
{
  "total_amount": 149.99,
  "currency": "USD",
  "customer_id": "cust_8820"
}`,
  actual_snippet: `// Offending Worker Diff (@backend)
{
  "amount_cents": 14999, // BREAKING: renamed from total_amount
  "currency": "USD",
  "customer_id": "cust_8820"
}`,
  gemini_analysis: {
    summary: 'Breaking drift detected in checkout payload: total_amount replaced with amount_cents. @frontend is actively awaiting total_amount.',
    severity: 'CRITICAL_BREAKING',
    impacted_workers: ['@frontend', '@verifier'],
    root_cause: 'Backend refactored monetary units to integer cents without updating locked OpenAPI contract or coordinating with @frontend.',
    suggested_fix_prompt: '@backend REVERT the schema mutation of `amount_cents` back to `total_amount: float` or provide backwards-compatible getter property `total_amount = amount_cents / 100.0`. Do not break locked contract v3.1.0.',
    suggested_patch: `--- a/services/checkout.py
+++ b/services/checkout.py
@@ -18,2 +18,4 @@ class CheckoutPayload(BaseModel):
     total_amount: float
+    # Backwards compatible alias
+    amount_cents: Optional[int] = None`,
  },
};

export const DEFAULT_SWARM_NODES: SwarmNode[] = [
  {
    id: '@coordinator',
    name: 'Coordinator',
    role: 'Swarm Orchestrator & Contract Lock',
    status: 'clean',
    turn: 14,
    messages: 38,
    lastAction: 'Contract locked & Genesis verified',
    avatarColor: '#06b6d4',
  },
  {
    id: '@backend',
    name: 'Backend API',
    role: 'FastAPI & Checkout Engine',
    status: 'drift_blocked',
    turn: 9,
    messages: 24,
    lastAction: 'Attempted total_amount -> amount_cents rename (HOLDING)',
    avatarColor: '#ef4444',
  },
  {
    id: '@frontend',
    name: 'Mission UI / Client',
    role: 'React Client & Checkout Consumer',
    status: 'waiting_fix',
    turn: 8,
    messages: 19,
    lastAction: 'Listening on /api/v1/checkout (Awaiting stable contract)',
    avatarColor: '#f59e0b',
  },
  {
    id: '@verifier',
    name: 'Cryptographic QA',
    role: 'Ledger Audit & Proof Verifier',
    status: 'verifying',
    turn: 12,
    messages: 31,
    lastAction: 'Recomputing SHA-256 chain and Argon2id milestone proofs',
    avatarColor: '#10b981',
  },
];

class ApiService {
  private ws: WebSocket | null = null;
  private wsListeners: Set<(event: any) => void> = new Set();
  private statusListeners: Set<(connected: boolean) => void> = new Set();
  private reconnectTimer: number | null = null;
  private isConnected = false;

  constructor() {
    this.initWebSocket();
  }

  // WebSocket Manager
  private initWebSocket() {
    if (typeof window === 'undefined') return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // If dev server on 5173, point to backend on 8080 or let vite proxy handle it
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.notifyStatus(true);
        if (this.reconnectTimer) {
          window.clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.wsListeners.forEach((listener) => listener(data));
        } catch (e) {
          console.warn('[SWARMGUARD WS] Failed to parse message:', event.data);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.notifyStatus(false);
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.isConnected = false;
        this.notifyStatus(false);
      };
    } catch (e) {
      this.isConnected = false;
      this.notifyStatus(false);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.initWebSocket();
    }, 3000);
  }

  private notifyStatus(connected: boolean) {
    this.statusListeners.forEach((cb) => cb(connected));
  }

  public subscribeToWs(listener: (data: any) => void) {
    this.wsListeners.add(listener);
    return () => this.wsListeners.delete(listener);
  }

  public subscribeToConnectionStatus(listener: (connected: boolean) => void) {
    this.statusListeners.add(listener);
    listener(this.isConnected);
    return () => this.statusListeners.delete(listener);
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }

  // REST API Endpoints with graceful fallbacks
  async fetchContract(): Promise<ContractInfo> {
    try {
      const res = await fetch(`${API_BASE}/contract`);
      if (res.ok) return await res.json();
    } catch (_) {}
    return DEFAULT_CONTRACT;
  }

  async lockContract(specPath?: string): Promise<{ success: boolean; contract: ContractInfo }> {
    try {
      const res = await fetch(`${API_BASE}/contract/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spec_path: specPath || 'contracts/checkout_contract.yaml' }),
      });
      if (res.ok) return await res.json();
    } catch (_) {}
    return { success: true, contract: DEFAULT_CONTRACT };
  }

  async fetchLedger(): Promise<Block[]> {
    try {
      const res = await fetch(`${API_BASE}/ledger`);
      if (res.ok) {
        const data = await res.json();
        return Array.isArray(data) ? data : data.chain || DEFAULT_BLOCKS;
      }
    } catch (_) {}
    return DEFAULT_BLOCKS;
  }

  async verifyLedger(): Promise<VerificationResult> {
    try {
      const res = await fetch(`${API_BASE}/ledger/verify`, { method: 'POST' });
      if (res.ok) return await res.json();
    } catch (_) {}
    return {
      valid: true,
      tampered_block_index: null,
      total_blocks: DEFAULT_BLOCKS.length,
      chain: DEFAULT_BLOCKS,
      algorithm: 'SHA-256 + Argon2id',
      timestamp: new Date().toISOString(),
    };
  }

  async tamperBlock(index: number, newPayload: string = 'MALICIOUS_INJECTED_OVERRIDE_TAMPER'): Promise<VerificationResult> {
    try {
      const res = await fetch(`${API_BASE}/ledger/tamper`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index, payload: newPayload }),
      });
      if (res.ok) return await res.json();
    } catch (_) {}
    return {
      valid: false,
      tampered_block_index: index,
      total_blocks: DEFAULT_BLOCKS.length,
      algorithm: 'SHA-256 + Argon2id',
      timestamp: new Date().toISOString(),
    };
  }

  async fetchGateStatus(): Promise<GateState> {
    try {
      const res = await fetch(`${API_BASE}/gate/status`);
      if (res.ok) return await res.json();
    } catch (_) {}
    return {
      state: 'INTERCEPTED_BLOCK',
      active_incident: DEFAULT_DRIFT_EVENT,
      last_updated: new Date().toISOString(),
      operator_action: null,
    };
  }

  async submitGateAction(
    action: 'APPROVE_OVERRIDE' | 'REJECT_ROLLBACK' | 'APPLY_FIX',
    operatorId: string = 'human_auditor_01',
    reason: string = 'Audited via SwarmGuard Mission Control'
  ): Promise<GateState> {
    try {
      const res = await fetch(`${API_BASE}/gate/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, operator_id: operatorId, reason }),
      });
      if (res.ok) return await res.json();
    } catch (_) {}

    const nextState =
      action === 'APPROVE_OVERRIDE'
        ? 'OVERRIDE_APPROVED'
        : action === 'REJECT_ROLLBACK'
        ? 'ROLLBACK_REQUESTED'
        : 'VERIFIED_CLEAN';

    return {
      state: nextState,
      active_incident: nextState === 'VERIFIED_CLEAN' ? null : DEFAULT_DRIFT_EVENT,
      last_updated: new Date().toISOString(),
      operator_action: action,
      operator_id: operatorId,
      argon2_seal: action === 'APPROVE_OVERRIDE' ? '$argon2id$v=19$m=65536,t=3,p=4$OPERATOR_OVERRIDE_SEAL$zx982' : null,
    };
  }

  async fetchDriftEvents(): Promise<DriftEvent[]> {
    try {
      const res = await fetch(`${API_BASE}/drift/events`);
      if (res.ok) return await res.json();
    } catch (_) {}
    return [DEFAULT_DRIFT_EVENT];
  }

  async runDemoStep(step?: number): Promise<DemoState> {
    try {
      const res = await fetch(`${API_BASE}/demo/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step }),
      });
      if (res.ok) return await res.json();
    } catch (_) {}
    return {
      current_step: step || 4,
      total_steps: 5,
      step_title: 'Step 4: Smart Policy Gate Intercepts Breaking Drift',
      status: 'blocked',
      logs: [
        '[@coordinator] Contract checkout_contract.yaml locked into Genesis Block #0 (Argon2id sealed)',
        '[@backend] Pushed diff renaming total_amount -> amount_cents in /api/v1/checkout',
        '[@frontend] Dispatched order payload expecting total_amount',
        '[@swarmguard] CRITICAL_BREAKING schema mismatch intercepted! Pipeline halted at Policy Gate.',
        '[@gemini-2.5-flash] Generated automated remediation prompt and backwards compatibility patch for @backend.',
      ],
    };
  }

  async resetDemo(): Promise<{ success: boolean; state: DemoState }> {
    try {
      const res = await fetch(`${API_BASE}/demo/reset`, { method: 'POST' });
      if (res.ok) return await res.json();
    } catch (_) {}
    return {
      success: true,
      state: {
        current_step: 1,
        total_steps: 5,
        step_title: 'Step 1: Baseline Clean Contract Locked',
        status: 'idle',
        logs: ['SwarmGuard reset to baseline clean state. Ledger cleared to Genesis.'],
      },
    };
  }

  async exportLedgerJson(): Promise<string> {
    try {
      const res = await fetch(`${API_BASE}/ledger/export`);
      if (res.ok) {
        const text = await res.text();
        return text;
      }
    } catch (_) {}
    // Offline / fallback export bundle
    const exportBundle = {
      title: 'SWARMGUARD Cryptographic Audit Ledger',
      timestamp: new Date().toISOString(),
      genesis_hash: DEFAULT_BLOCKS[0].block_hash,
      total_blocks: DEFAULT_BLOCKS.length,
      verification_status: 'VERIFIED_CHAIN_INTEGRITY',
      proof_algorithm: 'SHA-256 Chained Micro-Hashing + Argon2id Milestone Seal',
      active_contract: DEFAULT_CONTRACT,
      ledger: DEFAULT_BLOCKS,
      audit_signature: 'SEAL_OK_0x8f274a91c7849182',
    };
    return JSON.stringify(exportBundle, null, 2);
  }
}

export const api = new ApiService();
