import React, { useState } from 'react';
import { Shield, Radio, FileCode, Download, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import { ContractInfo } from '../types';
import { ShimmerButton } from './ui/shimmer-button';

interface HeaderProps {
  wsConnected: boolean;
  contract: ContractInfo;
  onExportLedger: () => void;
  exporting: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  wsConnected,
  contract,
  onExportLedger,
  exporting,
}) => {
  const [showContractModal, setShowContractModal] = useState(false);

  return (
    <>
      <header className="border-b border-obsidian-600 bg-obsidian-900/90 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Logo & Tactical Identity */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-11 h-11 rounded-lg bg-obsidian-800 border border-cyber-cyan/40 shadow-glow-cyan">
              <Shield className="w-6 h-6 text-cyber-cyan" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-cyan opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyber-cyan"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-wider text-slate-100 flex items-center gap-2 font-mono">
                  SWARMGUARD <span className="text-cyber-cyan">//</span> MISSION CONTROL
                </h1>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/30">
                  Antigravity /swarm
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                <span>ZERO-DRIFT CONTRACT VERIFIER</span>
                <span>•</span>
                <span>CRYPTOGRAPHIC FLIGHT RECORDER</span>
                <span>•</span>
                <span>SMART POLICY GATE</span>
              </p>
            </div>
          </div>

          {/* Right Status Controls & Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Live WebSocket Connection Badge */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono border transition-all ${
                wsConnected
                  ? 'bg-cyber-emerald/10 text-cyber-emerald border-cyber-emerald/40 shadow-glow-emerald'
                  : 'bg-cyber-crimson/10 text-cyber-crimson border-cyber-crimson/40 animate-pulse'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${wsConnected ? 'animate-pulse' : ''}`} />
              <span className="font-semibold">{wsConnected ? 'LIVE WS CONNECTED' : 'WS RECONNECTING'}</span>
            </div>

            {/* Contract Status Badge */}
            <button
              onClick={() => setShowContractModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-obsidian-800 hover:bg-obsidian-700 text-slate-200 border border-obsidian-600 text-xs font-mono transition-colors group"
              title="Click to view locked OpenAPI 3.1 specification"
            >
              <FileCode className="w-3.5 h-3.5 text-cyber-cyan group-hover:rotate-12 transition-transform" />
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">CONTRACT:</span>
                <span className="text-cyber-emerald font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 inline" />
                  LOCKED
                </span>
                <span className="text-slate-500 hidden sm:inline">[{contract.hash.slice(0, 8)}...]</span>
              </div>
            </button>

            {/* 1-Click Export Cryptographic Audit Ledger with Magic UI Shimmer */}
            <ShimmerButton
              onClick={onExportLedger}
              disabled={exporting}
              shimmerColor="#06b6d4"
              className="flex items-center gap-2 px-4 py-1.5 text-xs font-mono font-semibold text-cyber-cyan border-cyber-cyan/50 hover:border-cyber-cyan shadow-glow-cyan active:scale-95 disabled:opacity-50"
            >
              <Download className={`w-3.5 h-3.5 ${exporting ? 'animate-bounce' : ''}`} />
              <span>{exporting ? 'EXPORTING...' : 'EXPORT AUDIT LEDGER'}</span>
            </ShimmerButton>
          </div>
        </div>
      </header>

      {/* Contract Detail Modal */}
      {showContractModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-950/80 backdrop-blur-sm animate-fade-in">
          <div className="cyber-card w-full max-w-2xl bg-obsidian-900 border-cyber-cyan/40 shadow-glow-cyan overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-obsidian-600 bg-obsidian-800/60">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-cyber-cyan" />
                <h3 className="font-mono font-bold text-sm text-slate-100 uppercase">
                  Locked OpenAPI Contract // {contract.name}
                </h3>
              </div>
              <button
                onClick={() => setShowContractModal(false)}
                className="text-slate-400 hover:text-slate-100 font-mono text-sm px-2 py-0.5 rounded hover:bg-obsidian-700"
              >
                ✕ [ESC]
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded bg-obsidian-950/70 border border-obsidian-700">
                  <div className="text-slate-400 text-[10px]">SPECIFICATION & VER</div>
                  <div className="text-cyber-cyan font-bold mt-0.5">{contract.version}</div>
                  <div className="text-slate-300 text-[11px] mt-1">{contract.endpoint}</div>
                </div>
                <div className="p-3 rounded bg-obsidian-950/70 border border-obsidian-700">
                  <div className="text-slate-400 text-[10px]">SHA-256 GENESIS FINGERPRINT</div>
                  <div className="text-cyber-emerald font-mono text-[11px] break-all mt-0.5">
                    {contract.hash}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1.5">
                  <span>CANONICAL OPENAPI 3.1 YAML DEFINITION</span>
                  <span className="text-cyber-emerald flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> IMMUTABLE BASELINE
                  </span>
                </div>
                <pre className="p-3.5 rounded bg-obsidian-950 text-slate-300 font-mono text-xs border border-obsidian-700 overflow-x-auto leading-relaxed">
                  {contract.spec_snippet}
                </pre>
              </div>

              <div className="p-3 rounded bg-cyber-cyan/5 border border-cyber-cyan/20 text-xs text-slate-300 flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-cyber-cyan shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-cyber-cyan">Antigravity Invariant Guard:</span> Any worker AST modification in /swarm touching this endpoint that changes parameter names, data types, or removes required fields triggers an automatic intercept at the Smart Policy Gate.
                </div>
              </div>
            </div>

            <div className="flex justify-end px-5 py-3 border-t border-obsidian-700 bg-obsidian-800/40">
              <button
                onClick={() => setShowContractModal(false)}
                className="px-4 py-1.5 rounded bg-obsidian-700 hover:bg-obsidian-600 text-xs font-mono text-slate-200"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
