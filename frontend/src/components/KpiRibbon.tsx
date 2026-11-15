import React from 'react';
import { ShieldCheck, AlertTriangle, Users, DollarSign, Lock, HelpCircle, CheckCircle2 } from 'lucide-react';
import { Block, VerificationResult, GateState, ContractInfo } from '../types';

interface KpiRibbonProps {
  contract: ContractInfo;
  gateState: GateState;
  blocks: Block[];
  verification: VerificationResult;
}

export const KpiRibbon: React.FC<KpiRibbonProps> = ({
  contract,
  gateState,
  blocks,
  verification,
}) => {
  const isDriftDetected = gateState.state === 'INTERCEPTED_BLOCK' || Boolean(gateState.active_incident);
  const isValidLedger = verification.valid;

  const kpis = [
    {
      id: 'contract-status',
      title: 'API Contract Status',
      value: isDriftDetected ? 'Drift Intercepted' : 'Locked & Protected',
      subtext: isDriftDetected ? 'Schema mismatch halted at gate' : `${contract.name} (${contract.version})`,
      badge: isDriftDetected ? 'Awaiting Review' : 'Verified / Clean',
      badgeClass: isDriftDetected
        ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30'
        : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30',
      icon: isDriftDetected ? AlertTriangle : ShieldCheck,
      iconColor: isDriftDetected ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400',
      iconBg: isDriftDetected ? 'bg-rose-50 dark:bg-rose-500/10' : 'bg-emerald-50 dark:bg-emerald-500/10',
      tooltip: 'Continuous contract verifier monitors /api/v1/checkout. Enforces zero schema drift between parallel AI agents.',
    },
    {
      id: 'active-agents',
      title: 'Active AI Agents',
      value: '4 Parallel Workers',
      subtext: '@coordinator, @backend, @frontend, @verifier',
      badge: 'Active & Monitored',
      badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-400 dark:border-indigo-500/30',
      icon: Users,
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      iconBg: 'bg-indigo-50 dark:bg-indigo-500/10',
      tooltip: 'Orchestrates 4 independent Antigravity /swarm agents in parallel with automated collision prevention.',
    },
    {
      id: 'risk-prevented',
      title: 'Production Risk Prevented',
      value: '$0 Lost / 1 Crash Blocked',
      subtext: isDriftDetected ? '1 Breaking Checkout Crash Blocked' : 'Zero Runtime Schema Mismatches',
      badge: 'Protected',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30',
      icon: DollarSign,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
      tooltip: 'Interception prevented silent production crash where renamed total_amount would break checkout for 100% of customers.',
    },
    {
      id: 'compliance-ledger',
      title: 'Compliance Audit Trail',
      value: `${blocks.length} Tamper-Proof Blocks`,
      subtext: 'Argon2id + SHA-256 Chained',
      badge: isValidLedger ? 'Cryptographically Sealed' : 'Tamper Detected',
      badgeClass: isValidLedger
        ? 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/30'
        : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30',
      icon: Lock,
      iconColor: isValidLedger ? 'text-cyan-600 dark:text-cyan-400' : 'text-rose-600 dark:text-rose-400',
      iconBg: isValidLedger ? 'bg-cyan-50 dark:bg-cyan-500/10' : 'bg-rose-50 dark:bg-rose-500/10',
      tooltip: 'Immutable append-only flight recorder ledger with SHA-256 chaining and Argon2id milestone proofs for SOC 2 compliance.',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {kpis.map((kpi) => {
        const IconComponent = kpi.icon;
        return (
          <div
            key={kpi.id}
            className="enterprise-card p-4 relative group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            {/* Top row: Title and Icon */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400 font-sans tracking-tight">
                  {kpi.title}
                </span>
                {/* Tooltip trigger icon */}
                <div className="relative flex items-center">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 cursor-help transition-colors" />
                  {/* Tooltip flyout */}
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:flex flex-col items-center z-50 pointer-events-none w-56">
                    <div className="bg-slate-900 text-white dark:bg-slate-800 text-[11px] font-sans font-normal rounded-lg py-1.5 px-3 shadow-xl border border-slate-700/80 text-center leading-relaxed">
                      {kpi.tooltip}
                    </div>
                    <div className="w-2 h-2 bg-slate-900 dark:bg-slate-800 rotate-45 -mt-1 border-r border-b border-slate-700/80"></div>
                  </div>
                </div>
              </div>

              <div className={`p-2 rounded-lg ${kpi.iconBg} ${kpi.iconColor}`}>
                <IconComponent className="w-4 h-4" />
              </div>
            </div>

            {/* Main Metric Value */}
            <div className="text-lg font-bold text-slate-900 dark:text-white font-sans tracking-tight">
              {kpi.value}
            </div>

            {/* Bottom row: Subtext & Badge */}
            <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-[11px] gap-2">
              <span className="text-slate-500 dark:text-slate-400 truncate font-sans">
                {kpi.subtext}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium font-sans border whitespace-nowrap shrink-0 ${kpi.badgeClass}`}
              >
                {kpi.badge}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
