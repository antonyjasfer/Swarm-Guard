import React, { useState } from 'react';
import {
  Play,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  FileCode,
  Terminal,
  ChevronRight,
  Lock,
  ArrowRight,
  Shield,
  Layers,
  Code2
} from 'lucide-react';
import { DemoState } from '../types';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

interface DemoControlsProps {
  demoState: DemoState;
  onRunFullDemo: () => Promise<void>;
  onStepNext: () => Promise<void>;
  onSimulateDrift: () => Promise<void>;
  onResetBaseline: () => Promise<void>;
  loading: boolean;
  onLockContract?: () => Promise<void>;
  onApplyFix?: () => Promise<void>;
}

export const DemoControls: React.FC<DemoControlsProps> = ({
  demoState,
  onRunFullDemo,
  onStepNext,
  onSimulateDrift,
  onResetBaseline,
  loading,
  onLockContract,
  onApplyFix,
}) => {
  const [activeStepTab, setActiveStepTab] = useState<number>(() => {
    if (demoState.current_step <= 1) return 1;
    if (demoState.current_step <= 3) return 2;
    return 3;
  });

  // Calculate current 1-2-3 phase based on demoState
  const currentPhase = demoState.current_step <= 1 ? 1 : demoState.current_step <= 3 ? 2 : 3;

  const handleStep1Click = async () => {
    setActiveStepTab(1);
    if (onLockContract) {
      await onLockContract();
    } else {
      await onResetBaseline();
    }
    toast.success('Step 1 Complete: API Contract locked into Genesis block with SHA-256 fingerprint.');
  };

  const handleStep2Click = async () => {
    setActiveStepTab(2);
    await onSimulateDrift();
    toast.warning('Step 2 Intercepted: Multi-agent bug caught! @backend renamed total_amount to amount_cents.');
  };

  const handleStep3Click = async () => {
    setActiveStepTab(3);
    if (onApplyFix) {
      await onApplyFix();
    } else {
      await onStepNext();
    }
    try {
      confetti({ particleCount: 60, spread: 55, origin: { y: 0.8 } });
    } catch (_) {}
    toast.success('Step 3 Complete: Gemini 2.5 auto-healed the contract. Cryptographic trail verified clean!');
  };

  const handleLaunchFullDemo = async () => {
    setActiveStepTab(3);
    await onRunFullDemo();
    try {
      confetti({ particleCount: 75, spread: 65, origin: { y: 0.8 } });
    } catch (_) {}
    toast.success('Full Multi-Agent Collision Scenario executed successfully!');
  };

  const handleReset = async () => {
    setActiveStepTab(1);
    await onResetBaseline();
    toast.info('SwarmGuard reset to clean baseline contract.');
  };

  return (
    <div className="enterprise-card p-5 space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80 dark:border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-sans text-sm font-semibold text-slate-900 dark:text-white">
              Guided 1-2-3 Multi-Agent Safety Tour
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 font-sans">
              Interactive Demo
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-0.5">
            Experience how SwarmGuard catches uncoordinated breaking changes across parallel AI agents in real time.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleLaunchFullDemo}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-sans font-medium transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Run Full 3-Step Demo</span>
          </button>

          <button
            onClick={handleReset}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-sans font-medium transition-colors disabled:opacity-50"
            title="Reset to clean baseline contract"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Baseline</span>
          </button>
        </div>
      </div>

      {/* 3-Step Guided Stepper Tour Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Step 1: Lock API Contract */}
        <div
          onClick={handleStep1Click}
          role="button"
          tabIndex={0}
          className={`cursor-pointer p-4 rounded-xl border text-left transition-all duration-200 relative overflow-hidden group ${
            activeStepTab === 1
              ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-500/80 shadow-sm ring-1 ring-indigo-500/20'
              : currentPhase > 1
              ? 'bg-slate-50/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              : 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold font-sans shrink-0 ${
                  currentPhase > 1
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                    : activeStepTab === 1
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {currentPhase > 1 ? <CheckCircle2 className="w-4 h-4" /> : '1'}
              </span>
              <span className="font-sans font-semibold text-xs text-slate-900 dark:text-white">
                1. Lock API Contract
              </span>
            </div>
            <Lock className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors shrink-0" />
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans mt-2 leading-relaxed">
            Seals OpenAPI 3.1 Checkout schema into Genesis Block #0 with cryptographic SHA-256 fingerprint.
          </p>

          <div className="mt-3 flex items-center justify-between text-[11px] font-sans">
            <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
              /api/v1/checkout
            </span>
            <span className="text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 flex items-center gap-0.5 text-[10px]">
              Inspect Schema <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Step 2: Simulate Multi-Agent Bug */}
        <div
          onClick={handleStep2Click}
          role="button"
          tabIndex={0}
          className={`cursor-pointer p-4 rounded-xl border text-left transition-all duration-200 relative overflow-hidden group ${
            activeStepTab === 2
              ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-500/80 shadow-sm ring-1 ring-rose-500/20'
              : currentPhase === 2
              ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
              : 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-800'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold font-sans shrink-0 ${
                  activeStepTab === 2 || currentPhase === 2
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                2
              </span>
              <span className="font-sans font-semibold text-xs text-slate-900 dark:text-white">
                2. Simulate Multi-Agent Bug
              </span>
            </div>
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans mt-2 leading-relaxed">
            Triggers @backend changing <code className="font-mono text-[10px] bg-rose-100 dark:bg-rose-900/40 px-1 py-0.5 rounded text-rose-700 dark:text-rose-300">total_amount</code> to <code className="font-mono text-[10px] bg-rose-100 dark:bg-rose-900/40 px-1 py-0.5 rounded text-rose-700 dark:text-rose-300">amount_cents</code>.
          </p>

          <div className="mt-3 flex items-center justify-between text-[11px] font-sans">
            <span className="text-rose-600 dark:text-rose-400 font-medium text-[10px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              Policy Gate Intercepts
            </span>
            <span className="text-slate-400 group-hover:text-rose-600 dark:group-hover:text-rose-400 flex items-center gap-0.5 text-[10px]">
              Trigger Drift <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Step 3: Auto-Heal with Gemini 2.5 */}
        <div
          onClick={handleStep3Click}
          role="button"
          tabIndex={0}
          className={`cursor-pointer p-4 rounded-xl border text-left transition-all duration-200 relative overflow-hidden group ${
            activeStepTab === 3
              ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-500/80 shadow-sm ring-1 ring-emerald-500/20'
              : 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold font-sans shrink-0 ${
                  activeStepTab === 3
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                3
              </span>
              <span className="font-sans font-semibold text-xs text-slate-900 dark:text-white">
                3. Auto-Heal & Verify Trail
              </span>
            </div>
            <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans mt-2 leading-relaxed">
            1-click AI fix by Gemini 2.5 Flash, restores backward compatibility and validates Argon2id ledger.
          </p>

          <div className="mt-3 flex items-center justify-between text-[11px] font-sans">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium text-[10px] flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              100% Zero Downtime
            </span>
            <span className="text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 flex items-center gap-0.5 text-[10px]">
              Apply AI Fix <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Guided Step Detail Inspection Drawer */}
      <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 p-4">
        {activeStepTab === 1 && (
          <div className="space-y-3 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-semibold text-slate-900 dark:text-white font-sans">
                  Step 1 Overview: Locked E-Commerce Checkout API Contract
                </span>
              </div>
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                SHA-256: 9f83a48e69c4f1e9b2512f38d728564a9c8b74619d8542918e7e1f486b3b2841
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 font-sans leading-relaxed">
              <strong>Executive Summary:</strong> The locked contract defines the contract between frontend consumers and the checkout backend. Key required fields include <code className="font-mono text-xs text-indigo-600 dark:text-indigo-400">items</code>, <code className="font-mono text-xs text-indigo-600 dark:text-indigo-400">total_amount (float)</code>, <code className="font-mono text-xs text-indigo-600 dark:text-indigo-400">currency</code>, and <code className="font-mono text-xs text-indigo-600 dark:text-indigo-400">customer_id</code>. All parallel AI agents must adhere to this baseline.
            </p>

            <pre className="p-3 rounded-lg bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
{`{
  "/api/v1/checkout": {
    "post": {
      "summary": "Process customer order",
      "required": ["items", "total_amount", "currency", "customer_id"],
      "properties": {
        "items": [{ "product_id": "string", "quantity": "integer", "unit_price": "float" }],
        "total_amount": "number (float, e.g. 149.99)",
        "currency": "string (e.g. 'USD')",
        "customer_id": "string"
      }
    }
  }
}`}
            </pre>
          </div>
        )}

        {activeStepTab === 2 && (
          <div className="space-y-3 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span className="text-xs font-semibold text-slate-900 dark:text-white font-sans">
                  Step 2 Overview: Multi-Agent Breaking Collision Caught
                </span>
              </div>
              <span className="text-[11px] font-sans font-medium px-2 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                Critical Breaking Drift Intercepted
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 font-sans leading-relaxed">
              <strong>Why this was blocked:</strong> The backend agent refactored monetary units to integer cents, renaming <code className="font-mono text-xs text-rose-600 dark:text-rose-400">total_amount</code> to <code className="font-mono text-xs text-rose-600 dark:text-rose-400">amount_cents</code> without coordinating. The frontend agent was simultaneously pushing client code expecting <code className="font-mono text-xs">total_amount</code>. SwarmGuard intercepted this mismatch at the Policy Gate before merging.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                <div className="font-sans font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                  Expected by Client Contract
                </div>
                <code className="font-mono text-[11px] text-emerald-800 dark:text-emerald-300">
                  {`"total_amount": 149.99`}
                </code>
              </div>
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30">
                <div className="font-sans font-semibold text-rose-700 dark:text-rose-400 mb-1">
                  Attempted by Backend Agent
                </div>
                <code className="font-mono text-[11px] text-rose-800 dark:text-rose-300">
                  {`"amount_cents": 14999 (BREAKING MISMATCH)`}
                </code>
              </div>
            </div>
          </div>
        )}

        {activeStepTab === 3 && (
          <div className="space-y-3 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-semibold text-slate-900 dark:text-white font-sans">
                  Step 3 Overview: Automated AI Remediation & Cryptographic Audit
                </span>
              </div>
              <span className="text-[11px] font-sans font-medium px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                Gemini 2.5 Flash Remediated
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 font-sans leading-relaxed">
              <strong>Remediation Strategy:</strong> Gemini 2.5 Flash synthesized a backward-compatible alias (<code className="font-mono text-xs">total_amount</code> kept alongside optional <code className="font-mono text-xs">amount_cents</code>). The Policy Approval Gate verified the contract, unblocked the swarm, and sealed the resolution into the audit ledger with an Argon2id milestone proof.
            </p>

            <div className="p-3 rounded-lg bg-slate-900 text-slate-200 border border-slate-800 font-mono text-[11px] leading-relaxed">
              <span className="text-indigo-400">[@gemini-2.5-flash]</span> Suggested patch: Keep <span className="text-emerald-400">total_amount: float</span> for client compatibility; expose getter for <span className="text-cyan-400">amount_cents</span>. Both frontend and backend succeed with zero breaking changes.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
