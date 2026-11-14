import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { SwarmGraph } from './components/SwarmGraph';
import { DriftFeed } from './components/DriftFeed';
import { PolicyGateModal } from './components/PolicyGateModal';
import { FlightRecorderView } from './components/FlightRecorderView';
import { DemoControls } from './components/DemoControls';
import {
  api,
  DEFAULT_CONTRACT,
  DEFAULT_BLOCKS,
  DEFAULT_DRIFT_EVENT,
  DEFAULT_SWARM_NODES,
} from './services/api';
import {
  Block,
  VerificationResult,
  DriftEvent,
  GateState,
  ContractInfo,
  DemoState,
  SwarmNode,
} from './types';
import { Shield, Zap, AlertTriangle, CheckCircle2, Lock, Cpu } from 'lucide-react';

export const App: React.FC = () => {
  // State
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [contract, setContract] = useState<ContractInfo>(DEFAULT_CONTRACT);
  const [blocks, setBlocks] = useState<Block[]>(DEFAULT_BLOCKS);
  const [verification, setVerification] = useState<VerificationResult>({
    valid: true,
    tampered_block_index: null,
    total_blocks: DEFAULT_BLOCKS.length,
    chain: DEFAULT_BLOCKS,
  });
  const [driftEvents, setDriftEvents] = useState<DriftEvent[]>([DEFAULT_DRIFT_EVENT]);
  const [gateState, setGateState] = useState<GateState>({
    state: 'INTERCEPTED_BLOCK',
    active_incident: DEFAULT_DRIFT_EVENT,
    last_updated: new Date().toISOString(),
    operator_action: null,
  });
  const [swarmNodes, setSwarmNodes] = useState<SwarmNode[]>(DEFAULT_SWARM_NODES);
  const [demoState, setDemoState] = useState<DemoState>({
    current_step: 4,
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
  });

  const [policyModalOpen, setPolicyModalOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);

  // Initial Data Fetch
  useEffect(() => {
    let mounted = true;

    async function loadInitialData() {
      try {
        const [loadedContract, loadedBlocks, loadedVerify, loadedGate, loadedDrifts] = await Promise.all([
          api.fetchContract(),
          api.fetchLedger(),
          api.verifyLedger(),
          api.fetchGateStatus(),
          api.fetchDriftEvents(),
        ]);

        if (mounted) {
          if (loadedContract) setContract(loadedContract);
          if (loadedBlocks && loadedBlocks.length > 0) setBlocks(loadedBlocks);
          if (loadedVerify) setVerification(loadedVerify);
          if (loadedGate) setGateState(loadedGate);
          if (loadedDrifts && loadedDrifts.length > 0) setDriftEvents(loadedDrifts);
        }
      } catch (err) {
        console.warn('[SWARMGUARD] Operating in standalone/offline mode with fallback baseline:', err);
      }
    }

    loadInitialData();

    // Subscribe to WebSocket status
    const unsubStatus = api.subscribeToConnectionStatus((connected) => {
      if (mounted) setWsConnected(connected);
    });

    // Subscribe to WebSocket events
    const unsubWs = api.subscribeToWs((event) => {
      if (!mounted) return;
      console.log('[SWARMGUARD WS RX]', event);

      if (event.type === 'NEW_BLOCK' && event.block) {
        setBlocks((prev) => [...prev, event.block]);
      } else if (event.type === 'DRIFT_DETECTED' && event.drift) {
        setDriftEvents((prev) => [event.drift, ...prev]);
        setGateState((prev) => ({
          ...prev,
          state: 'INTERCEPTED_BLOCK',
          active_incident: event.drift,
        }));
        setSwarmNodes((prev) =>
          prev.map((n) =>
            n.id === '@backend' ? { ...n, status: 'drift_blocked' } : n
          )
        );
      } else if (event.type === 'GATE_STATE_CHANGE' && event.gate) {
        setGateState(event.gate);
        if (event.gate.state === 'VERIFIED_CLEAN' || event.gate.state === 'OVERRIDE_APPROVED') {
          setSwarmNodes((prev) =>
            prev.map((n) => ({ ...n, status: 'clean' }))
          );
        }
      } else if (event.type === 'DEMO_UPDATE' && event.demo) {
        setDemoState(event.demo);
      }
    });

    return () => {
      mounted = false;
      unsubStatus();
      unsubWs();
    };
  }, []);

  // 1-Click Export Cryptographic Audit Ledger
  const handleExportLedger = async () => {
    setExporting(true);
    try {
      const jsonContent = await api.exportLedgerJson();
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `swarmguard-audit-ledger-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to export ledger:', e);
    } finally {
      setExporting(false);
    }
  };

  // Smart Gate Action (Approve / Reject / Fix)
  const handleGateAction = async (
    action: 'APPROVE_OVERRIDE' | 'REJECT_ROLLBACK' | 'APPLY_FIX',
    operatorId: string,
    reason: string
  ) => {
    setLoading(true);
    try {
      const nextGate = await api.submitGateAction(action, operatorId, reason);
      setGateState(nextGate);

      // Create new ledger block recording the operator action
      const newBlock: Block = {
        index: blocks.length,
        timestamp: new Date().toISOString(),
        worker_id: operatorId,
        action_type: action.toLowerCase(),
        payload_hash: '8f274a91c78491823c8471e9821034ba981023948e7129384019283746152019',
        payload_preview: `Operator Action [${action}]: ${reason}`,
        prev_hash: blocks[blocks.length - 1]?.block_hash || '0000000000000000000000000000000000000000000000000000000000000000',
        block_hash: '9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
        argon2_seal: nextGate.argon2_seal || (action === 'APPROVE_OVERRIDE' ? '$argon2id$v=19$m=65536,t=3,p=4$OPERATOR_SEAL$982' : null),
      };

      setBlocks((prev) => [...prev, newBlock]);

      if (action === 'APPROVE_OVERRIDE' || action === 'APPLY_FIX') {
        setSwarmNodes((prev) =>
          prev.map((n) => ({
            ...n,
            status: 'clean',
            lastAction: action === 'APPLY_FIX' ? 'Gemini fix applied (In-sync)' : 'Override granted with Argon2id seal',
          }))
        );
      } else {
        setSwarmNodes((prev) =>
          prev.map((n) =>
            n.id === '@backend'
              ? { ...n, status: 'waiting_fix', lastAction: 'Rollback enforced. Awaiting clean revision.' }
              : n
          )
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Simulate Tamper
  const handleTamperBlock = async (index: number) => {
    setLoading(true);
    try {
      const tampered = await api.tamperBlock(index);
      setVerification(tampered);
      setBlocks((prev) =>
        prev.map((b) => (b.index === index ? { ...b, tampered: true, payload_preview: '🚨 [TAMPERED_CONTENT_INJECTED_ATTACK]' } : b))
      );
    } finally {
      setLoading(false);
    }
  };

  // Restore & Re-Verify
  const handleRestoreAndVerify = async () => {
    setLoading(true);
    try {
      const restored = await api.verifyLedger();
      setVerification(restored);
      // Reset blocks payload
      setBlocks((prev) =>
        prev.map((b) => ({
          ...b,
          tampered: false,
          payload_preview:
            b.index === 0
              ? 'Locked contracts/checkout_contract.yaml (SHA-256 genesis fingerprint computed)'
              : b.index === 1
              ? 'Verified test assertions for E-Commerce Checkout API schema baseline'
              : 'Renamed total_amount: float -> amount_cents: int in /api/v1/checkout endpoint',
        }))
      );
    } finally {
      setLoading(false);
    }
  };

  // Demo Controls
  const handleRunFullDemo = async () => {
    setLoading(true);
    try {
      const state = await api.runDemoStep(4);
      setDemoState(state);
      setGateState((prev) => ({
        ...prev,
        state: 'INTERCEPTED_BLOCK',
        active_incident: DEFAULT_DRIFT_EVENT,
      }));
      setSwarmNodes((prev) =>
        prev.map((n) => (n.id === '@backend' ? { ...n, status: 'drift_blocked' } : n))
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStepNext = async () => {
    setLoading(true);
    try {
      const nextStepNum = demoState.current_step >= 5 ? 1 : demoState.current_step + 1;
      const state = await api.runDemoStep(nextStepNum);
      setDemoState(state);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateDrift = async () => {
    setGateState({
      state: 'INTERCEPTED_BLOCK',
      active_incident: DEFAULT_DRIFT_EVENT,
      last_updated: new Date().toISOString(),
      operator_action: null,
    });
    setSwarmNodes((prev) =>
      prev.map((n) =>
        n.id === '@backend'
          ? { ...n, status: 'drift_blocked', lastAction: 'Attempted breaking field rename' }
          : n
      )
    );
    setPolicyModalOpen(true);
  };

  const handleResetBaseline = async () => {
    setLoading(true);
    try {
      const res = await api.resetDemo();
      setDemoState(res.state);
      setGateState({
        state: 'VERIFIED_CLEAN',
        active_incident: null,
        last_updated: new Date().toISOString(),
        operator_action: null,
      });
      setSwarmNodes((prev) =>
        prev.map((n) => ({
          ...n,
          status: 'clean',
          lastAction: 'In-sync with locked baseline contract',
        }))
      );
      setVerification({
        valid: true,
        tampered_block_index: null,
        total_blocks: 2,
        chain: DEFAULT_BLOCKS.slice(0, 2),
      });
      setBlocks(DEFAULT_BLOCKS.slice(0, 2));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian-900 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        wsConnected={wsConnected}
        contract={contract}
        onExportLedger={handleExportLedger}
        exporting={exporting}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-6">
        {/* Tactical Status Metric Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Metric 1: Flight Recorder */}
          <div className="cyber-card p-3.5 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase">Cryptographic Flight Recorder</div>
              <div className="text-lg font-mono font-bold text-cyber-cyan mt-0.5 flex items-center gap-1.5">
                <span>{blocks.length} BLOCKS</span>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-cyber-cyan/15 text-cyber-cyan">
              <Lock className="w-4 h-4" />
            </div>
          </div>

          {/* Metric 2: Drift Interceptor */}
          <div className="cyber-card p-3.5 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase">Drift Interceptor</div>
              <div className="text-lg font-mono font-bold text-cyber-crimson mt-0.5 flex items-center gap-1.5">
                <span>{gateState.active_incident ? '1 CRITICAL' : '0 DRIFTS'}</span>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-cyber-crimson/15 text-cyber-crimson">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>

          {/* Metric 3: Smart Policy Gate */}
          <div className="cyber-card p-3.5 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase">Smart Policy Gate</div>
              <div className="text-xs font-mono font-bold mt-1">
                <span
                  className={`px-2 py-0.5 rounded ${
                    gateState.state === 'INTERCEPTED_BLOCK'
                      ? 'badge-crimson animate-pulse'
                      : 'badge-verified'
                  }`}
                >
                  {gateState.state}
                </span>
              </div>
            </div>
            <div
              className={`p-2 rounded-lg ${
                gateState.state === 'INTERCEPTED_BLOCK'
                  ? 'bg-cyber-crimson/15 text-cyber-crimson'
                  : 'bg-cyber-emerald/15 text-cyber-emerald'
              }`}
            >
              <Shield className="w-4 h-4" />
            </div>
          </div>

          {/* Metric 4: AI Analysis Engine */}
          <div className="cyber-card p-3.5 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase">Gemini 2.5 Engine</div>
              <div className="text-xs font-mono font-bold text-purple-300 mt-1 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyber-violet animate-ping" />
                ONLINE // READY
              </div>
            </div>
            <div className="p-2 rounded-lg bg-cyber-violet/15 text-cyber-violet">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Section 1: Swarm Topology Graph & Drift Interceptor Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 flex">
            <div className="w-full">
              <SwarmGraph nodes={swarmNodes} gateState={gateState.state} />
            </div>
          </div>

          <div className="lg:col-span-6 flex">
            <div className="w-full">
              <DriftFeed
                events={driftEvents}
                onOpenGateModal={() => setPolicyModalOpen(true)}
              />
            </div>
          </div>
        </div>

        {/* Section 2: 1-Click Hackathon Demo Runner Controls */}
        <DemoControls
          demoState={demoState}
          onRunFullDemo={handleRunFullDemo}
          onStepNext={handleStepNext}
          onSimulateDrift={handleSimulateDrift}
          onResetBaseline={handleResetBaseline}
          loading={loading}
        />

        {/* Section 3: Cryptographic Flight Recorder Ledger & Tamper Explorer */}
        <FlightRecorderView
          blocks={blocks}
          verification={verification}
          onTamperBlock={handleTamperBlock}
          onRestoreAndVerify={handleRestoreAndVerify}
          loading={loading}
        />
      </main>

      {/* Policy Gate Modal */}
      <PolicyGateModal
        isOpen={policyModalOpen}
        onClose={() => setPolicyModalOpen(false)}
        gateState={gateState}
        activeDrift={gateState.active_incident}
        onGateAction={handleGateAction}
        loading={loading}
      />

      {/* Footer */}
      <footer className="border-t border-obsidian-700 bg-obsidian-950 py-4 px-6 text-center text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            SWARMGUARD // Antigravity /swarm Zero-Drift Guardian
          </div>
          <div className="text-slate-400">
            Berkeley x DeepMind Hackathon • Cloud Run Deploy Ready • SHA-256 + Argon2id
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
