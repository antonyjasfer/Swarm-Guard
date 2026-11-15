import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Undo2,
  KeyRound,
  Sparkles,
  X,
  CheckCircle2,
  Lock,
  Copy,
  Check,
  FileCode,
  UserCheck,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { GateState, DriftEvent } from '../types';

interface PolicyGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  gateState: GateState;
  activeDrift: DriftEvent | null;
  onGateAction: (
    action: 'APPROVE_OVERRIDE' | 'REJECT_ROLLBACK' | 'APPLY_FIX',
    operatorId: string,
    reason: string
  ) => Promise<void>;
  loading: boolean;
}

export const PolicyGateModal: React.FC<PolicyGateModalProps> = ({
  isOpen,
  onClose,
  gateState,
  activeDrift,
  onGateAction,
  loading,
}) => {
  const [operatorId, setOperatorId] = useState('platform_lead_sarah');
  const [overrideReason, setOverrideReason] = useState(
    'Backwards-compatible alias verified by SwarmGuard automated contract gate'
  );
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const isBlocked = gateState.state === 'INTERCEPTED_BLOCK';

  const defaultFixPrompt =
    activeDrift?.gemini_analysis?.suggested_fix_prompt ||
    `# Gemini 2.5 Flash Backwards-Compatibility Remediation Patch\n# Applied to: CheckoutPayload in @backend\n\n@property\ndef total_amount(self) -> float:\n    """Backwards-compatibility getter for legacy frontend checkout callers."""\n    return self.amount_cents / 100.0\n\n@total_amount.setter\ndef total_amount(self, value: float) -> None:\n    self.amount_cents = int(round(value * 100))`;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(defaultFixPrompt);
    setCopiedPrompt(true);
    toast.success('Remediation prompt copied to clipboard');
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleAction = async (action: 'APPROVE_OVERRIDE' | 'REJECT_ROLLBACK' | 'APPLY_FIX') => {
    setActionSuccessMessage(null);

    try {
      if (action === 'APPLY_FIX') {
        // Trigger celebratory confetti
        try {
          confetti({
            particleCount: 90,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#10b981', '#6366f1', '#06b6d4', '#8b5cf6'],
          });
        } catch {
          // fallback if confetti canvas fails
        }

        toast.success('Gemini 2.5 Flash patch applied! Swarm resumed with verified compatibility.', {
          description: 'Backwards-compatible getter alias injected into @backend checkout model.',
        });
        setActionSuccessMessage('Gemini 2.5 Flash patch applied. All agents synchronized in Verified / Clean state.');
      } else if (action === 'APPROVE_OVERRIDE') {
        toast.warning('Breaking contract override approved with Argon2id cryptographic milestone seal.', {
          description: 'Override logged into Flight Recorder ledger Block chain.',
        });
        setActionSuccessMessage('Override sealed into Cryptographic Ledger with Argon2id memory-hard signature.');
      } else {
        toast.error('Rollback directive dispatched to @backend. Intercepted diff rejected.', {
          description: 'Worker state reset to previous clean milestone.',
        });
        setActionSuccessMessage('Diff rejected. Rollback directive broadcast to @backend via swarm message board.');
      }

      await onGateAction(action, operatorId, overrideReason);
    } catch (err) {
      toast.error('Action failed. Check API connectivity.');
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 dark:bg-black/80 backdrop-blur-md animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-2xl rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Drawer / Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                isBlocked
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
              }`}
            >
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                SwarmGuard Policy Approval Gate
                <span
                  className={`text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full border ${
                    isBlocked
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  {isBlocked ? 'Drift Intercepted' : 'Clean & Verified'}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Arbitration Panel & Automated AI Remediation Gateway
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Action Success Alert */}
          {actionSuccessMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-sans text-xs flex items-center gap-2.5 shadow-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>{actionSuccessMessage}</span>
            </div>
          )}

          {/* Incident Overview Card */}
          {activeDrift && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Intercepted Schema Drift Incident
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  {new Date(activeDrift.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-sans leading-relaxed">
                Worker <code className="font-mono font-semibold text-rose-600 dark:text-rose-400">{activeDrift.worker_id}</code> introduced a breaking mutation on API endpoint <code className="font-mono text-slate-900 dark:text-slate-100 font-medium">/api/v1/checkout</code>.
              </p>
              <div className="text-xs font-mono text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400">Violation Details: </span>
                {activeDrift.details}
              </div>
            </div>
          )}

          {/* Gemini 2.5 Flash Exact Remediation Prompt Box */}
          <div className="rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-gradient-to-br from-indigo-500/5 via-violet-500/5 to-slate-50 dark:from-indigo-950/30 dark:via-purple-950/20 dark:to-slate-950 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-slate-100">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span>Gemini 2.5 Flash Exact Remediation Directive</span>
                <span className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  AI Remediation
                </span>
              </div>
              <button
                onClick={handleCopyPrompt}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 text-[11px] font-medium transition-colors"
              >
                {copiedPrompt ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copiedPrompt ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-3 rounded-lg bg-slate-950 text-indigo-200 font-mono text-xs overflow-x-auto leading-relaxed border border-indigo-900/40">
              {defaultFixPrompt}
            </pre>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              This backwards-compatible alias ensures active frontend checkout clients continue functioning without disruption while the backend migration proceeds.
            </p>
          </div>

          {/* Cryptographic Argon2id Seal Info (if sealed) */}
          {gateState.argon2_seal && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-1.5">
              <div className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                Argon2id Milestone Seal Verified
              </div>
              <div className="text-[11px] font-mono text-slate-700 dark:text-slate-300 break-all bg-white dark:bg-slate-950 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                {gateState.argon2_seal}
              </div>
            </div>
          )}

          {/* Operator Audit Credentials Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                Operator Signature / ID:
              </label>
              <input
                type="text"
                value={operatorId}
                onChange={(e) => setOperatorId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                Audit Justification:
              </label>
              <input
                type="text"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-sans"
              />
            </div>
          </div>

          {/* Action Choice Grid */}
          <div className="space-y-3 pt-2">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Select Policy Gate Action:
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {/* Option 1: Apply AI Fix & Resume Swarm (1-Click Primary) */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleAction('APPLY_FIX')}
                disabled={loading}
                className="w-full p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/10 via-indigo-500/10 to-emerald-500/5 hover:from-emerald-500/20 hover:to-indigo-500/15 border-2 border-emerald-500/40 hover:border-emerald-500 text-left flex items-start gap-3.5 transition-all group shadow-sm disabled:opacity-50"
              >
                <div className="p-2 rounded-xl bg-emerald-500 text-white shrink-0 group-hover:scale-105 transition-transform shadow-sm">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    ✨ Apply AI Fix & Resume Swarm
                    <span className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold">
                      RECOMMENDED
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    Injects automated backwards-compatible alias so <code className="font-mono text-emerald-600 dark:text-emerald-400">total_amount</code> and <code className="font-mono text-emerald-600 dark:text-emerald-400">amount_cents</code> are both safely supported, instantly unblocking @frontend checkout consumers.
                  </p>
                </div>
              </motion.button>

              {/* Option 2: Approve Breaking Override (Argon2id Seal) */}
              <button
                onClick={() => handleAction('APPROVE_OVERRIDE')}
                disabled={loading}
                className="w-full p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-indigo-400 text-left flex items-start gap-3.5 transition-all group disabled:opacity-50"
              >
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0 group-hover:scale-105 transition-transform border border-indigo-500/20">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    Approve Breaking Override (Argon2id Seal)
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    Signs and seals the schema migration with a memory-hard Argon2id proof into the Flight Recorder ledger and unfreezes swarm workers.
                  </p>
                </div>
              </button>

              {/* Option 3: Rollback Agent */}
              <button
                onClick={() => handleAction('REJECT_ROLLBACK')}
                disabled={loading}
                className="w-full p-3.5 rounded-xl bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/30 hover:border-rose-500 text-left flex items-start gap-3.5 transition-all group disabled:opacity-50"
              >
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0 group-hover:scale-105 transition-transform border border-rose-500/20">
                  <Undo2 className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-rose-700 dark:text-rose-400">
                    Rollback Agent
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    Rejects the breaking diff, halts the worker, and dispatches a git rollback directive back to @backend.
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-3.5 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors"
          >
            Dismiss Panel
          </button>
        </div>
      </motion.div>
    </div>
  );
};
