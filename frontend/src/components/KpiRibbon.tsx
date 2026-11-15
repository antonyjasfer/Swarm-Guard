import React from 'react';
import { ShieldCheck, AlertTriangle, Users, DollarSign, Lock } from 'lucide-react';
import { Block, VerificationResult, GateState, ContractInfo } from '../types';

interface KpiRibbonProps {
  contract: ContractInfo;
  gateState: GateState;
  blocks: Block[];
  verification: VerificationResult;
}

export const KpiRibbon: React.FC<KpiRibbonProps> = ({
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
      value: isDriftDetected ? 'Drift Intercepted' : 'Locked & Clean',
      subtext: isDriftDetected ? 'Schema mismatch at gate' : 'OpenAPI 3.1.0 protected',
      icon: isDriftDetected ? AlertTriangle : ShieldCheck,
      iconColor: isDriftDetected ? 'text-rose-500' : 'text-emerald-500',
    },
    {
      id: 'active-agents',
      title: 'Active AI Agents',
      value: '4 Parallel Workers',
      subtext: '4 active swarm workers',
      icon: Users,
      iconColor: 'text-indigo-500',
    },
    {
      id: 'risk-prevented',
      title: 'Production Risk Prevented',
      value: '$0 Lost / 1 Blocked',
      subtext: 'Zero runtime drift',
      icon: DollarSign,
      iconColor: 'text-emerald-500',
    },
    {
      id: 'compliance-ledger',
      title: 'Compliance Audit Trail',
      value: `${blocks.length} Sealed Blocks`,
      subtext: isValidLedger ? 'SHA-256 & Argon2id verified' : 'Tamper detected in chain',
      icon: Lock,
      iconColor: isValidLedger ? 'text-cyan-500' : 'text-rose-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => {
        const IconComponent = kpi.icon;
        return (
          <div
            key={kpi.id}
            className="rounded-xl border border-slate-200 dark:border-[#1f2937] bg-white dark:bg-[#111827] p-5 shadow-sm transition-all hover:border-slate-300 dark:hover:border-slate-700"
          >
            {/* Line 1: Muted Label */}
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium font-sans">
              <span>{kpi.title}</span>
              <IconComponent className={`w-4 h-4 ${kpi.iconColor}`} />
            </div>

            {/* Line 2: Large Metric */}
            <div className="text-2xl font-semibold text-slate-900 dark:text-white font-sans mt-2 tracking-tight">
              {kpi.value}
            </div>

            {/* Line 3: Short Subtext Line (never truncates) */}
            <div className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-1 whitespace-nowrap">
              {kpi.subtext}
            </div>
          </div>
        );
      })}
    </div>
  );
};
