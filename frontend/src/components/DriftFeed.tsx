import React, { useState } from 'react';
import { AlertTriangle, Sparkles, Copy, Check, GitCommit, ArrowRight, ShieldAlert, Cpu } from 'lucide-react';
import { DriftEvent } from '../types';

interface DriftFeedProps {
  events: DriftEvent[];
  onOpenGateModal: () => void;
}

export const DriftFeed: React.FC<DriftFeedProps> = ({ events, onOpenGateModal }) => {
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || 'drift-evt-001');
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const activeEvent = events.find((e) => e.id === selectedEventId) || events[0];

  const handleCopyPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  if (!activeEvent) {
    return (
      <div className="cyber-card p-6 flex flex-col items-center justify-center text-center">
        <ShieldAlert className="w-10 h-10 text-cyber-emerald mb-2" />
        <h3 className="font-mono text-sm font-bold text-slate-200">NO ACTIVE DRIFT EVENTS</h3>
        <p className="text-xs text-slate-400 mt-1">All agent AST AST tool calls align with the locked OpenAPI contract.</p>
      </div>
    );
  }

  return (
    <div className="cyber-card p-5 space-y-5">
      {/* Feed Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-obsidian-600">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="w-5 h-5 text-cyber-crimson animate-pulse" />
          <div>
            <h2 className="font-mono text-xs font-bold tracking-wider uppercase text-slate-200 flex items-center gap-2">
              Live Drift Interceptor Feed
              <span className="text-[10px] px-2 py-0.5 rounded badge-crimson font-mono">
                {activeEvent.severity}
              </span>
            </h2>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Target: <span className="text-cyber-cyan">{activeEvent.details}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenGateModal}
            className="px-3 py-1.5 rounded-lg bg-cyber-crimson/15 hover:bg-cyber-crimson/25 text-cyber-crimson border border-cyber-crimson/40 text-xs font-mono font-semibold transition-all shadow-glow-crimson flex items-center gap-1.5"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>OPEN POLICY GATE</span>
          </button>
        </div>
      </div>

      {/* Side-by-Side Comparison: Contract vs Implementation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Locked Contract Expectation */}
        <div className="rounded-lg bg-obsidian-950 border border-obsidian-700 overflow-hidden flex flex-col">
          <div className="px-3 py-2 bg-obsidian-900 border-b border-obsidian-700 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-300 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyber-emerald" />
              LOCKED CONTRACT EXPECTATION
            </span>
            <span className="text-slate-500 text-[10px]">checkout_contract.yaml</span>
          </div>
          <div className="p-3 font-mono text-xs overflow-x-auto flex-1 bg-obsidian-950/80 leading-relaxed text-slate-300">
            <pre className="whitespace-pre">
              {activeEvent.expected_snippet}
            </pre>
          </div>
          <div className="px-3 py-1.5 bg-obsidian-900/60 border-t border-obsidian-800 text-[11px] font-mono text-cyber-emerald">
            ✓ Required field: <span className="font-bold underline">total_amount (float)</span>
          </div>
        </div>

        {/* Right: Worker Diff Interception */}
        <div className="rounded-lg bg-obsidian-950 border border-cyber-crimson/40 shadow-glow-crimson overflow-hidden flex flex-col">
          <div className="px-3 py-2 bg-obsidian-900 border-b border-cyber-crimson/30 flex items-center justify-between text-xs font-mono">
            <span className="text-cyber-crimson font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyber-crimson animate-ping" />
              INTERCEPTED DIFF // {activeEvent.worker_id}
            </span>
            <span className="text-cyber-crimson/70 text-[10px] font-bold">MUTATION DETECTED</span>
          </div>
          <div className="p-3 font-mono text-xs overflow-x-auto flex-1 bg-obsidian-950/80 leading-relaxed text-slate-300">
            <pre className="whitespace-pre">
              {activeEvent.actual_snippet}
            </pre>
          </div>
          <div className="px-3 py-1.5 bg-cyber-crimson/10 border-t border-cyber-crimson/20 text-[11px] font-mono text-cyber-crimson flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 shrink-0" />
            <span>Breaking change: renamed to <span className="font-bold underline">amount_cents (int)</span></span>
          </div>
        </div>
      </div>

      {/* Raw Git AST Diff Snippet */}
      {activeEvent.diff_text && (
        <div className="rounded-lg bg-obsidian-950 border border-obsidian-700 overflow-hidden">
          <div className="px-3 py-1.5 bg-obsidian-900 border-b border-obsidian-800 flex items-center gap-2 text-xs font-mono text-slate-400">
            <GitCommit className="w-3.5 h-3.5 text-cyber-cyan" />
            <span>AST PARSER INTERCEPTED PATCH // {activeEvent.worker_id}</span>
          </div>
          <pre className="p-3 font-mono text-xs text-slate-300 overflow-x-auto bg-obsidian-950">
            {activeEvent.diff_text.split('\n').map((line, idx) => {
              const isAdded = line.startsWith('+');
              const isRemoved = line.startsWith('-');
              return (
                <div
                  key={idx}
                  className={`${
                    isAdded
                      ? 'bg-cyber-crimson/15 text-cyber-crimson font-semibold'
                      : isRemoved
                      ? 'bg-cyber-emerald/10 text-cyber-emerald'
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

      {/* Gemini 2.5 Flash Semantic Analysis Card */}
      {activeEvent.gemini_analysis && (
        <div className="rounded-xl bg-gradient-to-br from-cyber-violet/10 via-obsidian-900 to-obsidian-950 border border-cyber-violet/40 p-4 shadow-glow-violet space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-cyber-violet/20 flex items-center justify-center text-cyber-violet">
                <Sparkles className="w-4 h-4 animate-spin-slow" />
              </div>
              <div>
                <h3 className="font-mono text-xs font-bold text-slate-100 flex items-center gap-2">
                  GEMINI 2.5 FLASH // MULTI-AGENT ROOT CAUSE & REMEDIATION
                  <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-cyber-violet/20 text-purple-300 border border-cyber-violet/40">
                    AUTOMATED
                  </span>
                </h3>
                <span className="text-[11px] font-mono text-slate-400">
                  Impacted Swarm Workers: {activeEvent.gemini_analysis.impacted_workers.join(', ')}
                </span>
              </div>
            </div>

            <button
              onClick={() => handleCopyPrompt(activeEvent.gemini_analysis?.suggested_fix_prompt || '')}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-obsidian-800 hover:bg-obsidian-700 text-purple-300 border border-cyber-violet/30 text-xs font-mono transition-colors"
            >
              {copiedPrompt ? <Check className="w-3.5 h-3.5 text-cyber-emerald" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedPrompt ? 'COPIED FIX PROMPT' : 'COPY FIX PROMPT'}</span>
            </button>
          </div>

          <div className="text-xs text-slate-300 font-sans leading-relaxed bg-obsidian-950/60 p-3 rounded-lg border border-obsidian-800">
            <span className="text-cyber-violet font-mono font-semibold">Diagnosis: </span>
            {activeEvent.gemini_analysis.root_cause}
          </div>

          <div>
            <div className="text-[10px] font-mono uppercase text-slate-400 mb-1 flex items-center gap-1">
              <Cpu className="w-3 h-3 text-cyber-violet" />
              Auto-Generated Swarm Remediation Directive:
            </div>
            <div className="p-3 rounded-lg bg-obsidian-950 text-purple-200 font-mono text-xs border border-cyber-violet/20 leading-relaxed break-words">
              {activeEvent.gemini_analysis.suggested_fix_prompt}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
