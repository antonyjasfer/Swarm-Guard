import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, Undo2, KeyRound, Sparkles, X, CheckCircle2, Lock } from 'lucide-react';
import { GateState, DriftEvent } from '../types';

interface PolicyGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  gateState: GateState;
  activeDrift: DriftEvent | null;
  onGateAction: (action: 'APPROVE_OVERRIDE' | 'REJECT_ROLLBACK' | 'APPLY_FIX', operatorId: string, reason: string) => Promise<void>;
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
  const [operatorId, setOperatorId] = useState('human_auditor_01');
  const [overrideReason, setOverrideReason] = useState('Emergency migration approved by platform lead with backward compatibility verified');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAction = async (action: 'APPROVE_OVERRIDE' | 'REJECT_ROLLBACK' | 'APPLY_FIX') => {
    setActionSuccessMessage(null);
    await onGateAction(action, operatorId, overrideReason);
    if (action === 'APPROVE_OVERRIDE') {
      setActionSuccessMessage('Override sealed into Cryptographic Ledger with Argon2id memory-hard signature.');
    } else if (action === 'REJECT_ROLLBACK') {
      setActionSuccessMessage('Diff rejected. Rollback directive broadcast to @backend via swarm message board.');
    } else {
      setActionSuccessMessage('Gemini backward-compatibility patch automatically applied. Pipeline clean.');
    }
    setTimeout(() => {
      setActionSuccessMessage(null);
    }, 4000);
  };

  const isBlocked = gateState.state === 'INTERCEPTED_BLOCK';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-950/85 backdrop-blur-md animate-fade-in">
      <div className="cyber-card w-full max-w-2xl bg-obsidian-900 border-cyber-crimson/50 shadow-glow-crimson overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-obsidian-800/80 border-b border-obsidian-700">
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg ${isBlocked ? 'bg-cyber-crimson/20 text-cyber-crimson' : 'bg-cyber-emerald/20 text-cyber-emerald'}`}>
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-mono text-sm font-bold text-slate-100 flex items-center gap-2">
                SMART POLICY GATE // ARBITRATION PANEL
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                CURRENT STATE: <span className={`font-bold ${isBlocked ? 'text-cyber-crimson' : 'text-cyber-emerald'}`}>{gateState.state}</span>
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-obsidian-700 text-sm font-mono"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Action Success Alert */}
          {actionSuccessMessage && (
            <div className="p-3.5 rounded-lg bg-cyber-emerald/15 border border-cyber-emerald/40 text-cyber-emerald font-mono text-xs flex items-center gap-2 shadow-glow-emerald">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{actionSuccessMessage}</span>
            </div>
          )}

          {/* Incident Overview */}
          {activeDrift && (
            <div className="p-4 rounded-xl bg-obsidian-950 border border-cyber-crimson/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-cyber-crimson font-bold uppercase tracking-wider">
                  INTERCEPTED DRIFT INCIDENT
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {new Date(activeDrift.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-xs text-slate-200 font-sans">
                Worker <span className="font-mono font-bold text-cyber-crimson">{activeDrift.worker_id}</span> attempted to introduce a breaking schema change to the locked contract.
              </p>
              <div className="text-xs font-mono text-slate-400 bg-obsidian-900 p-2.5 rounded border border-obsidian-800">
                <span className="text-slate-500">VIOLATION: </span>
                {activeDrift.details}
              </div>
            </div>
          )}

          {/* Cryptographic Proof / Argon2id Seal Info if Approved */}
          {gateState.argon2_seal && (
            <div className="p-3.5 rounded-lg bg-cyber-emerald/10 border border-cyber-emerald/30 font-mono text-xs space-y-1">
              <div className="text-cyber-emerald font-bold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                ARGON2ID MILESTONE SEAL COMPUTED
              </div>
              <div className="text-[11px] text-slate-300 break-all bg-obsidian-950 p-2 rounded">
                {gateState.argon2_seal}
              </div>
            </div>
          )}

          {/* Operator Credentials Form */}
          <div className="space-y-3 font-mono text-xs">
            <div>
              <label className="block text-slate-400 mb-1">OPERATOR SIGNATURE / ID:</label>
              <input
                type="text"
                value={operatorId}
                onChange={(e) => setOperatorId(e.target.value)}
                className="w-full px-3 py-2 rounded bg-obsidian-950 border border-obsidian-700 text-slate-200 focus:outline-none focus:border-cyber-cyan"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">AUDIT JUSTIFICATION REASON:</label>
              <input
                type="text"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                className="w-full px-3 py-2 rounded bg-obsidian-950 border border-obsidian-700 text-slate-200 focus:outline-none focus:border-cyber-cyan"
              />
            </div>
          </div>

          {/* Action Choice Grid */}
          <div className="space-y-3 pt-2">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              SELECT SMART GATE ACTION:
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {/* Option 1: Auto-Apply Gemini Fix */}
              <button
                onClick={() => handleAction('APPLY_FIX')}
                disabled={loading}
                className="w-full p-3 rounded-xl bg-cyber-violet/10 hover:bg-cyber-violet/20 border border-cyber-violet/40 hover:border-cyber-violet text-left flex items-start gap-3 transition-all group shadow-glow-violet disabled:opacity-50"
              >
                <div className="p-2 rounded-lg bg-cyber-violet/20 text-cyber-violet shrink-0 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-mono text-xs font-bold text-purple-200 flex items-center gap-2">
                    Auto-Apply Gemini Backward-Compatible Fix
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyber-violet/30 text-purple-200">
                      RECOMMENDED
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Injects automated getter alias so total_amount and amount_cents are both safely supported without breaking @frontend.
                  </p>
                </div>
              </button>

              {/* Option 2: Approve Override with Argon2id */}
              <button
                onClick={() => handleAction('APPROVE_OVERRIDE')}
                disabled={loading}
                className="w-full p-3 rounded-xl bg-cyber-emerald/10 hover:bg-cyber-emerald/20 border border-cyber-emerald/40 hover:border-cyber-emerald text-left flex items-start gap-3 transition-all group shadow-glow-emerald disabled:opacity-50"
              >
                <div className="p-2 rounded-lg bg-cyber-emerald/20 text-cyber-emerald shrink-0 group-hover:scale-105 transition-transform">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-mono text-xs font-bold text-cyber-emerald">
                    Approve Override (Argon2id Milestone Seal)
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Signs and seals the migration with a memory-hard Argon2id proof into the Flight Recorder block chain and unlocks the pipeline.
                  </p>
                </div>
              </button>

              {/* Option 3: Reject & Enforce Rollback */}
              <button
                onClick={() => handleAction('REJECT_ROLLBACK')}
                disabled={loading}
                className="w-full p-3 rounded-xl bg-cyber-crimson/10 hover:bg-cyber-crimson/20 border border-cyber-crimson/40 hover:border-cyber-crimson text-left flex items-start gap-3 transition-all group disabled:opacity-50"
              >
                <div className="p-2 rounded-lg bg-cyber-crimson/20 text-cyber-crimson shrink-0 group-hover:scale-105 transition-transform">
                  <Undo2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-mono text-xs font-bold text-cyber-crimson">
                    Reject & Enforce Rollback
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Rejects the pull request diff, halts the worker, and dispatches a rollback directive back to @backend.
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-3 bg-obsidian-800/60 border-t border-obsidian-700">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-obsidian-700 hover:bg-obsidian-600 font-mono text-xs text-slate-300"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
