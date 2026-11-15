import React, { useState } from 'react';
import { Shield, Radio, FileCode, Download, CheckCircle2, Moon, Sun, X, Lock } from 'lucide-react';
import { ContractInfo } from '../types';
import { ShimmerButton } from './ui/shimmer-button';

interface HeaderProps {
  wsConnected: boolean;
  contract: ContractInfo;
  onExportLedger: () => void;
  exporting: boolean;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  wsConnected,
  contract,
  onExportLedger,
  exporting,
  theme = 'dark',
  onToggleTheme,
}) => {
  const [showContractModal, setShowContractModal] = useState(false);

  // Local fallback theme toggle if not handled by parent
  const handleThemeClick = () => {
    if (onToggleTheme) {
      onToggleTheme();
    } else {
      const isDark = document.documentElement.classList.contains('dark');
      if (isDark) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('swarmguard_theme', 'light');
      } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('swarmguard_theme', 'dark');
      }
    }
  };

  const isDarkMode = theme === 'dark' || (typeof document !== 'undefined' && document.documentElement.classList.contains('dark'));

  return (
    <>
      <header className="border-b border-slate-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-[#090a0f]/85 backdrop-blur-xl sticky top-0 z-40 px-4 lg:px-8 py-3.5 transition-colors duration-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Logo & Executive Identity */}
          <div className="flex items-center gap-3.5">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 dark:bg-slate-900 border border-indigo-200/80 dark:border-indigo-500/30 shadow-sm dark:shadow-glow-subtle">
              <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white font-sans">
                  SwarmGuard Enterprise
                </h1>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 font-sans">
                  Antigravity /swarm
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-sans flex items-center gap-2 mt-0.5">
                <span>Active Contract Verifier</span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span>Policy Approval Gate</span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span>Cryptographic Audit Ledger</span>
              </p>
            </div>
          </div>

          {/* Right Status Controls & Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Live WebSocket Connection Status */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-sans font-medium border transition-all ${
                wsConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30'
                  : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${wsConnected ? 'animate-pulse text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`} />
              <span>{wsConnected ? 'Live Telemetry' : 'Telemetry Offline'}</span>
            </div>

            {/* Contract Status Badge */}
            <button
              onClick={() => setShowContractModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80 text-xs font-sans transition-all group shadow-sm"
              title="Click to view locked OpenAPI 3.1 specification"
            >
              <FileCode className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Contract:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 inline" />
                  Locked
                </span>
                <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px] hidden sm:inline">
                  [{contract.hash.slice(0, 8)}]
                </span>
              </div>
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={handleThemeClick}
              aria-label="Toggle theme"
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80 transition-all shadow-sm"
              title={isDarkMode ? 'Switch to Stripe Light Mode' : 'Switch to Linear Obsidian Mode'}
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-45" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600 transition-transform hover:-rotate-12" />
              )}
            </button>

            {/* 1-Click Export Cryptographic Audit Ledger */}
            <ShimmerButton
              onClick={onExportLedger}
              disabled={exporting}
              shimmerColor="#6366f1"
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-sans font-medium text-slate-800 dark:text-indigo-300 border border-indigo-300/80 dark:border-indigo-500/40 hover:border-indigo-500 rounded-lg shadow-sm active:scale-95 disabled:opacity-50 transition-all"
            >
              <Download className={`w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 ${exporting ? 'animate-bounce' : ''}`} />
              <span>{exporting ? 'Exporting...' : 'Export Audit Ledger'}</span>
            </ShimmerButton>
          </div>
        </div>
      </header>

      {/* Contract Detail Modal */}
      {showContractModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="enterprise-card w-full max-w-2xl bg-white dark:bg-[#0f111a] border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden rounded-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
              <div className="flex items-center gap-2.5">
                <FileCode className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <h3 className="font-sans font-semibold text-sm text-slate-900 dark:text-white">
                    Locked API Contract — {contract.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">
                    Immutable contract baseline enforced across all parallel AI agents
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowContractModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-sans">
                <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800">
                  <div className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">SPECIFICATION & TARGET</div>
                  <div className="text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">{contract.version}</div>
                  <div className="text-slate-700 dark:text-slate-300 font-mono text-[11px] mt-1">{contract.endpoint}</div>
                </div>
                <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800">
                  <div className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">SHA-256 GENESIS FINGERPRINT</div>
                  <div className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px] break-all mt-0.5">
                    {contract.hash}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-sans text-slate-500 dark:text-slate-400 mb-1.5">
                  <span className="font-medium">OpenAPI 3.1 YAML Contract Schema</span>
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-sans text-[11px] font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Immutable Baseline
                  </span>
                </div>
                <pre className="p-4 rounded-lg bg-slate-900 text-slate-200 dark:bg-black/80 dark:text-slate-200 font-mono text-xs border border-slate-700 dark:border-slate-800 overflow-x-auto leading-relaxed">
                  {contract.spec_snippet}
                </pre>
              </div>

              <div className="p-3.5 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/40 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div className="font-sans leading-relaxed">
                  <span className="font-semibold text-slate-900 dark:text-white">Active Contract Policy:</span> Any parallel worker diff modifying endpoint parameter names, types, or schema structure triggers an immediate interception at the Policy Approval Gate to protect downstream consumers.
                </div>
              </div>
            </div>

            <div className="flex justify-end px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
              <button
                onClick={() => setShowContractModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-sans font-medium text-slate-800 dark:text-slate-200 transition-colors"
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
