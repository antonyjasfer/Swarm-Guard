import React, { useState } from 'react';
import {
  AlertTriangle,
  Sparkles,
  Copy,
  Check,
  GitCommit,
  ShieldAlert,
  Cpu,
  ArrowRight,
  ShieldCheck,
  FileCode,
  ExternalLink,
  Info,
} from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { DriftEvent } from '../types';

interface DriftFeedProps {
  events: DriftEvent[];
  onOpenGateModal: () => void;
  onAutoFix?: () => void;
}

export const DriftFeed: React.FC<DriftFeedProps> = ({ events, onOpenGateModal, onAutoFix }) => {
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || 'drift-evt-001');
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const activeEvent = events.find((e) => e.id === selectedEventId) || events[0];

  const handleCopyPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPrompt(true);
    toast.success('Gemini remediation prompt copied to clipboard');
    setTimeout(() => setCopiedPrompt(false), 2200);
  };

  const handleAutoFixClick = () => {
    toast.info('Opening Gemini 2.5 Flash Remediation Gateway...', {
      description: 'Preparing automated backwards-compatibility alias patch',
    });
    if (onAutoFix) {
      onAutoFix();
    } else {
      onOpenGateModal();
    }
  };

  if (!activeEvent) {
    return (
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/75 backdrop-blur-xl p-8 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          All Agent Contracts Clean & Compliant
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
          No schema drift detected. All agent tool calls and pull request patches match the locked OpenAPI checkout contract.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/75 backdrop-blur-xl shadow-sm p-5 space-y-5">
      {/* Feed Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Live Contract Drift Interception
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-sans font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                Critical Breaking Drift
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              API Path: <code className="font-mono text-indigo-600 dark:text-indigo-400 font-medium">/api/v1/checkout</code> · Worker: <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">{activeEvent.worker_id}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons: Auto-Fix with Gemini & Review Gate */}
        <div className="flex flex-wrap items-center gap-2.5">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAutoFixClick}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 flex items-center gap-2 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>✨ Auto-Fix with Gemini 2.5 Flash</span>
          </motion.button>

          <button
            onClick={onOpenGateModal}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium border border-slate-300/80 dark:border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>Review Policy Gate</span>
          </button>
        </div>
      </div>

      {/* Plain-English Business Impact Summary Banner */}
      <div className="p-4 rounded-xl bg-amber-500/10 dark:bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-tight uppercase text-amber-800 dark:text-amber-300">
              Executive Business Impact Assessment
            </span>
            <span className="text-[10px] font-sans px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 font-medium">
              Zero Production Downtime
            </span>
          </div>
          <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
            ⚠️ <strong>Why this was blocked:</strong> The Backend Agent renamed <code className="font-mono text-rose-600 dark:text-rose-400 bg-rose-500/10 px-1 py-0.5 rounded">total_amount</code> to <code className="font-mono text-rose-600 dark:text-rose-400 bg-rose-500/10 px-1 py-0.5 rounded">amount_cents</code>, which would crash the Frontend Checkout page for all customers.
          </p>
          <p className="text-[11px] text-slate-600 dark:text-slate-400">
            SwarmGuard Policy Gate intercepted the mutation in real time before compilation or deployment, preventing broken downstream dependencies.
          </p>
        </div>
      </div>

      {/* Side-by-Side Comparison: Contract vs. Implementation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Expected by Frontend Contract */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 overflow-hidden flex flex-col shadow-sm">
          <div className="px-3.5 py-2.5 bg-slate-100/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Expected by Frontend Contract
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-sans font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              OpenAPI 3.1 Spec
            </span>
          </div>
          <div className="p-3.5 font-mono text-xs overflow-x-auto flex-1 bg-white/50 dark:bg-slate-950/90 leading-relaxed text-slate-800 dark:text-slate-300">
            <pre className="whitespace-pre">
              {activeEvent.expected_snippet}
            </pre>
          </div>
          <div className="px-3.5 py-2 bg-emerald-500/5 dark:bg-emerald-500/10 border-t border-emerald-500/20 text-[11px] font-sans text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 shrink-0" />
            <span>
              Required contract field: <strong className="font-mono">total_amount (float)</strong>
            </span>
          </div>
        </div>

        {/* Right: Attempted by Backend Agent */}
        <div className="rounded-xl border border-rose-300 dark:border-rose-900/60 bg-rose-50/20 dark:bg-slate-950/70 overflow-hidden flex flex-col shadow-sm">
          <div className="px-3.5 py-2.5 bg-rose-500/10 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">
                Attempted by Backend Agent
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-sans font-medium px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
              Breaking Mutation Intercepted
            </span>
          </div>
          <div className="p-3.5 font-mono text-xs overflow-x-auto flex-1 bg-white/50 dark:bg-slate-950/90 leading-relaxed text-slate-800 dark:text-slate-300">
            <pre className="whitespace-pre">
              {activeEvent.actual_snippet}
            </pre>
          </div>
          <div className="px-3.5 py-2 bg-rose-500/10 border-t border-rose-500/20 text-[11px] font-sans text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>
              Breaking change: renamed to <strong className="font-mono">amount_cents (int)</strong> without backwards-compatibility getter
            </span>
          </div>
        </div>
      </div>

      {/* Raw AST Code Diff */}
      {activeEvent.diff_text && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 overflow-hidden shadow-sm">
          <div className="px-3.5 py-2 bg-slate-100/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2 font-mono">
              <GitCommit className="w-3.5 h-3.5 text-indigo-500" />
              <span>AST Patch Diff // {activeEvent.worker_id}</span>
            </div>
            <span className="text-[11px] font-sans text-slate-500">
              Unified Diff View
            </span>
          </div>
          <pre className="p-3.5 font-mono text-xs text-slate-800 dark:text-slate-300 overflow-x-auto bg-slate-950 dark:bg-slate-950 text-slate-200 leading-relaxed">
            {activeEvent.diff_text.split('\n').map((line, idx) => {
              const isAdded = line.startsWith('+');
              const isRemoved = line.startsWith('-');
              return (
                <div
                  key={idx}
                  className={`px-1 rounded ${
                    isAdded
                      ? 'bg-rose-500/20 text-rose-300 font-semibold'
                      : isRemoved
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'text-slate-400'
                  }`}
                >
                  {line}
                </div>
              );
            })}
          </pre>
        </div>
      )}

      {/* Gemini 2.5 Flash Semantic Analysis & 1-Click Fix Card */}
      {activeEvent.gemini_analysis && (
        <div className="rounded-2xl bg-gradient-to-br from-indigo-500/5 via-violet-500/5 to-slate-50 dark:from-indigo-950/30 dark:via-purple-950/20 dark:to-slate-900 border border-indigo-200 dark:border-indigo-800/60 p-4 sm:p-5 space-y-3.5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  Gemini 2.5 Flash Root Cause Analysis & Auto-Remediation
                  <span className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 font-medium">
                    AI Remediation Engine
                  </span>
                </h3>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Impacted Downstream Consumers: <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">{activeEvent.gemini_analysis.impacted_workers.join(', ')}</span>
                </span>
              </div>
            </div>

            <button
              onClick={() => handleCopyPrompt(activeEvent.gemini_analysis?.suggested_fix_prompt || '')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 text-xs font-medium transition-colors shadow-sm self-start sm:self-auto"
            >
              {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedPrompt ? 'Copied Prompt' : 'Copy AI Prompt'}</span>
            </button>
          </div>

          <div className="text-xs text-slate-700 dark:text-slate-300 font-sans leading-relaxed bg-white/70 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <strong className="text-indigo-600 dark:text-indigo-400 font-semibold">Diagnosis: </strong>
            {activeEvent.gemini_analysis.root_cause}
          </div>

          <div className="space-y-1.5">
            <div className="text-[11px] font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-500" />
              <span>Recommended Backwards-Compatible Remediation Directive:</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 text-indigo-200 font-mono text-xs border border-indigo-900/50 leading-relaxed overflow-x-auto">
              <pre className="whitespace-pre-wrap">{activeEvent.gemini_analysis.suggested_fix_prompt}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
