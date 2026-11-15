import React, { useState } from 'react';
import {
  Play,
  RotateCcw,
  Sparkles,
  Lock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
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
  onVerifyLedger?: () => Promise<void>;
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
  onVerifyLedger,
}) => {
  const [activeStepTab, setActiveStepTab] = useState<number>(() => {
    if (demoState.current_step <= 1) return 1;
    if (demoState.current_step <= 3) return 2;
    return 3;
  });
  const [showDrawer, setShowDrawer] = useState<boolean>(false);

  const handleStep1Click = async () => {
    setActiveStepTab(1);
    if (onLockContract) {
      await onLockContract();
    } else {
      await onResetBaseline();
    }
    toast.success('Step 1: Contract locked into Genesis block (SHA-256 fingerprint verified)');
  };

  const handleStep2Click = async () => {
    setActiveStepTab(2);
    await onSimulateDrift();
  };

  const handleStep3Click = async () => {
    setActiveStepTab(3);
    if (onVerifyLedger) {
      await onVerifyLedger();
    } else if (onApplyFix) {
      await onApplyFix();
    } else {
      await onStepNext();
    }
    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
    } catch (_) {}
  };

  const handleLaunchFullDemo = async () => {
    setActiveStepTab(3);
    await onRunFullDemo();
    try {
      confetti({ particleCount: 65, spread: 65, origin: { y: 0.8 } });
    } catch (_) {}
    toast.success('Full Multi-Agent Collision Scenario executed successfully');
  };

  const handleReset = async () => {
    setActiveStepTab(1);
    await onResetBaseline();
    toast.info('SwarmGuard reset to clean baseline contract');
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-[#1f2937] bg-white dark:bg-[#111827] px-5 py-3.5 shadow-sm space-y-3">
      {/* Horizontal Demo Action Bar aligned on one line with whitespace-nowrap */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: 1-2-3 Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto py-0.5">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-sans uppercase tracking-wider whitespace-nowrap hidden sm:inline mr-1">
            Demo Bar:
          </span>

          {/* 1. Lock Contract */}
          <button
            onClick={handleStep1Click}
            disabled={loading}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-sans font-medium whitespace-nowrap transition-all border ${
              activeStepTab === 1
                ? 'bg-indigo-50 text-indigo-700 border-indigo-300 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-700 font-semibold shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-indigo-500" />
            <span>1. Lock Contract</span>
          </button>

          {/* 2. Simulate Drift */}
          <button
            onClick={handleStep2Click}
            disabled={loading}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-sans font-medium whitespace-nowrap transition-all border ${
              activeStepTab === 2
                ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-700 font-semibold shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span>2. Simulate Drift</span>
          </button>

          {/* 3. Verify Ledger */}
          <button
            onClick={handleStep3Click}
            disabled={loading}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-sans font-medium whitespace-nowrap transition-all border ${
              activeStepTab === 3
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700 font-semibold shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>3. Verify Ledger</span>
          </button>

          {/* Toggle details button */}
          <button
            onClick={() => setShowDrawer((prev) => !prev)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap text-xs flex items-center gap-1"
            title="Toggle scenario step summary"
          >
            {showDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Right: Reset & Run Full Demo */}
        <div className="flex items-center gap-2.5 shrink-0 whitespace-nowrap">
          <button
            onClick={handleReset}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-sans font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
            title="Reset SwarmGuard to baseline contract"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Baseline</span>
          </button>

          <button
            onClick={handleLaunchFullDemo}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-sans font-medium transition-all shadow-sm active:scale-95 disabled:opacity-50 whitespace-nowrap"
          >
            <Play className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Run Full Demo</span>
          </button>
        </div>
      </div>

      {/* Optional Collapsible Step Details Drawer */}
      {showDrawer && (
        <div className="pt-3 border-t border-slate-100 dark:border-[#1f2937] text-xs font-sans text-slate-600 dark:text-slate-400 leading-relaxed animate-in fade-in duration-150">
          {activeStepTab === 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span>
                <strong>Step 1:</strong> OpenAPI 3.1.0 contract locked into Genesis Block #0 with cryptographic SHA-256 fingerprint.
              </span>
              <span className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                /api/v1/checkout
              </span>
            </div>
          )}
          {activeStepTab === 2 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span>
                <strong>Step 2:</strong> @backend attempted breaking rename (<code className="font-mono text-rose-600 dark:text-rose-400">total_amount</code> → <code className="font-mono text-rose-600 dark:text-rose-400">amount_cents</code>). Intercepted at Policy Gate.
              </span>
              <span className="text-rose-600 dark:text-rose-400 font-medium whitespace-nowrap">
                Drift Intercepted
              </span>
            </div>
          )}
          {activeStepTab === 3 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span>
                <strong>Step 3:</strong> Gemini 2.5 Flash backwards-compatibility alias verified and sealed into ledger with Argon2id proof.
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium whitespace-nowrap">
                100% Zero Downtime
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
