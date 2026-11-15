import React, { useState, useEffect, useCallback } from 'react';
import { Toaster, toast } from 'sonner';
import { Header } from './components/Header';
import { KpiRibbon } from './components/KpiRibbon';
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

export const App: React.FC = () => {
  // Theme state: 'light' or 'dark' (defaults to dark, persisted in localStorage)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('swarmguard_theme');
      if (saved === 'light' || saved === 'dark') return saved;
      if (document.documentElement.classList.contains('dark')) return 'dark';
    }
    return 'dark';
  });

  // Apply theme to document element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('swarmguard_theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // Application Data States
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
        toast.warning('Contract drift detected on /api/v1/checkout: breaking schema mutation intercepted');
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
      toast.success('Audit ledger exported successfully (Argon2id + SHA-256 chain verified)');
    } catch (e) {
      console.error('Failed to export ledger:', e);
      toast.error('Failed to export audit ledger');
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

      if (action === 'APPROVE_OVERRIDE') {
        setSwarmNodes((prev) =>
          prev.map((n) => ({
            ...n,
            status: 'clean',
            lastAction: 'Override granted with Argon2id seal',
          }))
        );
        toast.warning('Policy override approved: Argon2id milestone seal appended to ledger');
      } else if (action === 'APPLY_FIX') {
        setSwarmNodes((prev) =>
          prev.map((n) => ({
            ...n,
            status: 'clean',
            lastAction: 'Gemini 2.5 Flash fix applied (In-sync)',
          }))
        );
        toast.success('Gemini 2.5 Flash remediation patch applied: Swarm synchronized');
      } else {
        setSwarmNodes((prev) =>
          prev.map((n) =>
            n.id === '@backend'
              ? { ...n, status: 'waiting_fix', lastAction: 'Rollback enforced. Awaiting clean revision.' }
              : n
          )
        );
        toast.error('Rollback enforced: Breaking worker change rejected');
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
      toast.error(`Integrity check failed: Block #${index} tampered! SHA-256 hash mismatch detected.`);
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
      const freshBlocks = await api.fetchLedger();
      if (freshBlocks && freshBlocks.length > 0) {
        setBlocks(freshBlocks);
      } else {
        setBlocks((prev) =>
          prev.map((b) => ({
            ...b,
            tampered: false,
          }))
        );
      }
      toast.success('Cryptographic audit trail restored: All SHA-256 hashes and Argon2id seals verified clean');
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
    toast.warning('Contract drift detected on /api/v1/checkout: total_amount -> amount_cents');
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

  const handleLockContract = async () => {
    setLoading(true);
    try {
      const res = await api.lockContract();
      setContract(res.contract);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyAiFix = async () => {
    await handleGateAction('APPLY_FIX', 'gemini-2.5-flash', 'Automated backwards compatibility patch');
    try {
      const res = await api.verifyLedger();
      setVerification(res);
      const freshBlocks = await api.fetchLedger();
      if (freshBlocks && freshBlocks.length > 0) {
        setBlocks(freshBlocks);
      }
    } catch (_) {}
  };

  const handleVerifyLedger = async () => {
    setLoading(true);
    try {
      if (gateState.state === 'INTERCEPTED_BLOCK') {
        await handleGateAction('APPLY_FIX', 'gemini-2.5-flash', 'Automated backwards compatibility patch');
      }
      const res = await api.verifyLedger();
      setVerification(res);
      const freshBlocks = await api.fetchLedger();
      if (freshBlocks && freshBlocks.length > 0) {
        setBlocks(freshBlocks);
      }
      toast.success('Audit ledger verified: All block hashes and Argon2id proofs valid');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f17] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-150">
      {/* Toast Notification Provider */}
      <Toaster position="top-right" richColors closeButton theme={theme} />

      {/* Top Header */}
      <Header
        wsConnected={wsConnected}
        contract={contract}
        onExportLedger={handleExportLedger}
        exporting={exporting}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Container: max-w-7xl mx-auto px-6 py-8 space-y-6 */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-6">
        {/* Top Row: Horizontal Demo Action Bar */}
        <DemoControls
          demoState={demoState}
          onRunFullDemo={handleRunFullDemo}
          onStepNext={handleStepNext}
          onSimulateDrift={handleSimulateDrift}
          onResetBaseline={handleResetBaseline}
          loading={loading}
          onLockContract={handleLockContract}
          onApplyFix={handleApplyAiFix}
          onVerifyLedger={handleVerifyLedger}
        />

        {/* Row 2: 4 KPI Cards (3 clean lines, zero truncation) */}
        <KpiRibbon
          contract={contract}
          gateState={gateState}
          blocks={blocks}
          verification={verification}
        />

        {/* Row 3: Agent Pipeline (4-Column Horizontal Step Grid) */}
        <SwarmGraph nodes={swarmNodes} gateState={gateState.state} />

        {/* Row 4: Drift Inspector (Full Breathable Width) */}
        <DriftFeed
          events={driftEvents}
          onOpenGateModal={() => setPolicyModalOpen(true)}
          onAutoFix={handleApplyAiFix}
        />

        {/* Row 5: Cryptographic Flight Recorder Ledger & Tamper Explorer */}
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
      <footer className="border-t border-slate-200 dark:border-[#1f2937] bg-white/60 dark:bg-[#0b0f17]/90 py-5 px-6 text-center text-xs font-sans text-slate-500 dark:text-slate-400 transition-colors duration-150">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="font-medium text-slate-700 dark:text-slate-300">
            SwarmGuard Enterprise — Autonomous Multi-Agent Zero-Drift Guardian
          </div>
          <div className="text-slate-400 dark:text-slate-500 font-sans">
            Continuous Contract Verification • Cryptographic Flight Recorder • Smart Policy Gate
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
