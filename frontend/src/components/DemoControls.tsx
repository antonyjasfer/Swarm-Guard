import React, { useState } from 'react';
import { Play, SkipForward, AlertTriangle, RotateCcw, Terminal, CheckCircle2, Bot, ShieldAlert } from 'lucide-react';
import { DemoState } from '../types';

interface DemoControlsProps {
  demoState: DemoState;
  onRunFullDemo: () => Promise<void>;
  onStepNext: () => Promise<void>;
  onSimulateDrift: () => Promise<void>;
  onResetBaseline: () => Promise<void>;
  loading: boolean;
}

export const DemoControls: React.FC<DemoControlsProps> = ({
  demoState,
  onRunFullDemo,
  onStepNext,
  onSimulateDrift,
  onResetBaseline,
  loading,
}) => {
  const steps = [
    { num: 1, title: 'Contract Lock', desc: '@coordinator seals Genesis' },
    { num: 2, title: 'Backend Drift', desc: 'total_amount -> amount_cents' },
    { num: 3, title: 'Frontend Collision', desc: 'Client awaits total_amount' },
    { num: 4, title: 'Policy Gate Intercept', desc: 'SwarmGuard & Gemini fix' },
    { num: 5, title: 'Verifier Audit', desc: 'Argon2id + SHA-256 verified' },
  ];

  return (
    <div className="cyber-card p-5 space-y-5">
      {/* Title & Actions Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-obsidian-600">
        <div>
          <h2 className="font-mono text-xs font-bold tracking-wider uppercase text-slate-200 flex items-center gap-2">
            1-Click Hackathon Demo Runner // E-Commerce Collision Scenario
          </h2>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
            Demonstrates real-time contract drift interception and Gemini automated remediation in Antigravity /swarm
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Launch Full Demo */}
          <button
            onClick={onRunFullDemo}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-cyber-cyan/15 hover:bg-cyber-cyan/25 text-cyber-cyan border border-cyber-cyan/40 hover:border-cyber-cyan text-xs font-mono font-semibold transition-all shadow-glow-cyan disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Launch Full Collision Demo</span>
          </button>

          {/* Step Next */}
          <button
            onClick={onStepNext}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-obsidian-800 hover:bg-obsidian-700 text-slate-200 border border-obsidian-600 text-xs font-mono transition-colors disabled:opacity-50"
          >
            <SkipForward className="w-3.5 h-3.5 text-cyber-cyan" />
            <span>Step Next</span>
          </button>

          {/* Simulate Drift */}
          <button
            onClick={onSimulateDrift}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyber-crimson/10 hover:bg-cyber-crimson/20 text-cyber-crimson border border-cyber-crimson/30 text-xs font-mono transition-colors disabled:opacity-50"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Simulate Drift</span>
          </button>

          {/* Reset Baseline */}
          <button
            onClick={onResetBaseline}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-obsidian-800 hover:bg-obsidian-700 text-slate-300 border border-obsidian-600 text-xs font-mono transition-colors disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Baseline</span>
          </button>
        </div>
      </div>

      {/* 5-Step Timeline Visualizer */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1">
        {steps.map((st) => {
          const isDone = demoState.current_step > st.num;
          const isCurrent = demoState.current_step === st.num;

          return (
            <div
              key={st.num}
              className={`p-3 rounded-lg border font-mono transition-all ${
                isCurrent
                  ? 'bg-cyber-cyan/10 border-cyber-cyan shadow-glow-cyan'
                  : isDone
                  ? 'bg-obsidian-950/80 border-cyber-emerald/40 text-slate-300'
                  : 'bg-obsidian-950/40 border-obsidian-800 text-slate-500'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className={`font-bold ${isCurrent ? 'text-cyber-cyan' : isDone ? 'text-cyber-emerald' : 'text-slate-500'}`}>
                  STEP 0{st.num}
                </span>
                {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-cyber-emerald" />}
                {isCurrent && <span className="inline-block w-2 h-2 rounded-full bg-cyber-cyan animate-ping" />}
              </div>
              <div className="text-xs font-bold truncate text-slate-200">{st.title}</div>
              <div className="text-[10px] text-slate-400 truncate mt-0.5">{st.desc}</div>
            </div>
          );
        })}
      </div>

      {/* Real-time Scenario Execution Console */}
      <div className="rounded-xl bg-obsidian-950 border border-obsidian-700 overflow-hidden">
        <div className="px-4 py-2 bg-obsidian-900 border-b border-obsidian-800 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-300">
            <Terminal className="w-3.5 h-3.5 text-cyber-cyan" />
            <span>SWARMGUARD REAL-TIME INTERCEPTION LOG</span>
          </div>
          <span className="text-slate-500 text-[10px]">OUTPUT STREAM // ACTIVE</span>
        </div>
        <div className="p-3.5 font-mono text-xs text-slate-300 max-h-40 overflow-y-auto space-y-1.5 bg-obsidian-950">
          {demoState.logs && demoState.logs.length > 0 ? (
            demoState.logs.map((log, index) => {
              const isCoord = log.includes('[@coordinator]');
              const isBackend = log.includes('[@backend]');
              const isFrontend = log.includes('[@frontend]');
              const isSwarmGuard = log.includes('[@swarmguard]');
              const isGemini = log.includes('[@gemini');
              const isVerifier = log.includes('[@verifier]');

              return (
                <div key={index} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-slate-600 select-none text-[10px] mt-0.5">
                    {`0${index + 1}`.slice(-2)}:
                  </span>
                  <div
                    className={`${
                      isSwarmGuard
                        ? 'text-cyber-crimson font-semibold'
                        : isGemini
                        ? 'text-purple-300 font-semibold'
                        : isCoord
                        ? 'text-cyber-cyan'
                        : isBackend
                        ? 'text-amber-300'
                        : isFrontend
                        ? 'text-cyan-300'
                        : isVerifier
                        ? 'text-cyber-emerald'
                        : 'text-slate-300'
                    }`}
                  >
                    {log}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-slate-500 italic">No scenario events recorded yet. Click 'Launch Full Collision Demo' to start.</div>
          )}
        </div>
      </div>
    </div>
  );
};
