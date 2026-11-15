import React, { useState } from 'react';
import {
  AlertTriangle,
  Sparkles,
  Copy,
  Check,
  GitCommit,
  ShieldAlert,
  Cpu,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { DriftEvent } from '../types';

interface DriftFeedProps {
  events: DriftEvent[];
  onOpenGateModal: () => void;
  onAutoFix?: () => void;
}

export const DriftFeed: React.FC<DriftFeedProps> = ({ events, onOpenGateModal, onAutoFix }) => {
  const [selectedEventId] = useState<string>(events[0]?.id || 'drift-evt-001');
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const activeEvent = events.find((e) => e.id === selectedEventId) || events[0];

  const handleCopyPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPrompt(true);
    toast.success('Gemini remediation prompt copied to clipboard');
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleAutoFixClick = () => {
    if (onAutoFix) {
      onAutoFix();
    } else {
      onOpenGateModal();
    }
  };

  if (!activeEvent) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-[#1f2937] bg-white dark:bg-[#111827] p-8 flex flex-col items-center justify-center text-center">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-sans">
          All Agent Contracts Clean & Compliant
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm font-sans">
          No schema drift detected. All agent tool calls and diffs strictly match the locked OpenAPI checkout contract.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-[#1f2937] bg-white dark:bg-[#111827] p-6 shadow-sm space-y-5 w-full">
      {/* 1. Header Row on ONE clean flex row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-[#1f2937]">
        {/* Left side: Title + Single status badge */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20 shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-sans">
                Contract Drift Inspector
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 whitespace-nowrap">
                Drift Intercepted
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-0.5">
              Endpoint: <code className="font-mono text-indigo-600 dark:text-indigo-400">/api/v1/checkout</code> · Worker: <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{activeEvent.worker_id}</span>
            </p>
          </div>
        </div>

        {/* Right side: [Review Policy Gate] and [Auto-Fix with Gemini 2.5] side-by-side */}
        <div className="flex items-center gap-3 shrink-0 whitespace-nowrap">
          <button
            onClick={onOpenGateModal}
            className="px-3.5 py-2 rounded-lg bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-sans font-medium border border-slate-300 dark:border-slate-700 transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Review Policy Gate</span>
          </button>

          <button
            onClick={handleAutoFixClick}
            className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-sans font-medium transition-all shadow-sm flex items-center gap-2 whitespace-nowrap active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>Auto-Fix with Gemini 2.5</span>
          </button>
        </div>
      </div>

      {/* 2. "Why this was blocked" clean single-border alert bar */}
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 dark:text-slate-300 font-sans leading-relaxed">
          <strong className="font-semibold text-amber-700 dark:text-amber-400">Why this was blocked: </strong>
          The Backend Agent renamed <code className="font-mono text-xs bg-slate-100 dark:bg-slate-800 text-rose-600 dark:text-rose-400 px-1 py-0.5 rounded">total_amount</code> to <code className="font-mono text-xs bg-slate-100 dark:bg-slate-800 text-rose-600 dark:text-rose-400 px-1 py-0.5 rounded">amount_cents</code> in <code className="font-mono text-xs">/api/v1/checkout</code>. The Frontend Agent is expecting <code className="font-mono text-xs">total_amount</code>. SwarmGuard Policy Gate intercepted the mutation in real time before deployment.
        </div>
      </div>

      {/* 3. Clean 2-column side-by-side code comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Expected by Client Contract */}
        <div className="rounded-lg border border-slate-200 dark:border-[#1f2937] bg-slate-50/50 dark:bg-[#0d131f] overflow-hidden flex flex-col min-w-0">
          <div className="px-4 py-2.5 bg-slate-100/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-[#1f2937] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 font-sans">
                Expected by Client Contract
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
              OpenAPI 3.1 Spec
            </span>
          </div>

          <div className="p-4 overflow-x-auto flex-1 min-w-0">
            <pre className="font-mono text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre">
              {activeEvent.expected_snippet}
            </pre>
          </div>

          <div className="px-4 py-2 bg-emerald-500/5 border-t border-emerald-500/20 text-xs font-sans text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 whitespace-nowrap">
            <Check className="w-3.5 h-3.5 shrink-0" />
            <span>Required contract field: <strong className="font-mono">total_amount: float</strong></span>
          </div>
        </div>

        {/* Right: Attempted by Backend Agent */}
        <div className="rounded-lg border border-rose-200 dark:border-rose-900/40 bg-rose-50/10 dark:bg-[#0d131f] overflow-hidden flex flex-col min-w-0">
          <div className="px-4 py-2.5 bg-rose-500/10 dark:bg-rose-950/30 border-b border-rose-200 dark:border-rose-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
              <span className="text-xs font-semibold text-rose-700 dark:text-rose-400 font-sans">
                Attempted by Backend Agent
              </span>
            </div>
            <span className="text-[11px] font-mono text-rose-600 dark:text-rose-400 whitespace-nowrap">
              Breaking Mutation Intercepted
            </span>
          </div>

          <div className="p-4 overflow-x-auto flex-1 min-w-0">
            <pre className="font-mono text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre">
              {activeEvent.actual_snippet}
            </pre>
          </div>

          <div className="px-4 py-2 bg-rose-500/5 border-t border-rose-500/20 text-xs font-sans text-rose-700 dark:text-rose-400 flex items-center gap-1.5 whitespace-nowrap">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Breaking change: renamed to <strong className="font-mono">amount_cents: int</strong></span>
          </div>
        </div>
      </div>

      {/* Raw Unified AST Diff */}
      {activeEvent.diff_text && (
        <div className="rounded-lg border border-slate-200 dark:border-[#1f2937] bg-slate-50/50 dark:bg-[#0d131f] overflow-hidden">
          <div className="px-4 py-2 bg-slate-100/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-[#1f2937] flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2 font-mono">
              <GitCommit className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>AST Unified Patch Diff // {activeEvent.worker_id}</span>
            </div>
            <span className="text-[11px] font-sans text-slate-500 whitespace-nowrap">
              Unified Diff View
            </span>
          </div>
          <pre className="p-4 font-mono text-xs text-slate-200 overflow-x-auto bg-slate-950 leading-relaxed">
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

      {/* Gemini 2.5 Flash Root Cause Analysis & Remediation Card */}
      {activeEvent.gemini_analysis && (
        <div className="rounded-lg border border-slate-200 dark:border-[#1f2937] bg-slate-50/50 dark:bg-[#0d131f] p-4 sm:p-5 space-y-3.5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100 font-sans flex items-center gap-2">
                  Gemini 2.5 Flash Root Cause Analysis & Auto-Remediation
                </h3>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">
                  Impacted Downstream Consumers: <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">{activeEvent.gemini_analysis.impacted_workers.join(', ')}</span>
                </span>
              </div>
            </div>

            <button
              onClick={() => handleCopyPrompt(activeEvent.gemini_analysis?.suggested_fix_prompt || '')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 text-xs font-sans font-medium transition-colors shadow-sm self-start sm:self-auto whitespace-nowrap"
            >
              {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedPrompt ? 'Copied Prompt' : 'Copy AI Prompt'}</span>
            </button>
          </div>

          <div className="text-xs text-slate-700 dark:text-slate-300 font-sans leading-relaxed bg-white dark:bg-[#111827] p-3 rounded-lg border border-slate-200 dark:border-[#1f2937]">
            <strong className="text-indigo-600 dark:text-indigo-400 font-semibold">Diagnosis: </strong>
            {activeEvent.gemini_analysis.root_cause}
          </div>

          <div className="space-y-1.5">
            <div className="text-[11px] font-medium text-slate-600 dark:text-slate-400 font-sans flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-500" />
              <span>Recommended Backwards-Compatible Remediation Directive:</span>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-950 text-indigo-200 font-mono text-xs border border-indigo-900/50 leading-relaxed overflow-x-auto">
              <pre className="whitespace-pre-wrap">{activeEvent.gemini_analysis.suggested_fix_prompt}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
