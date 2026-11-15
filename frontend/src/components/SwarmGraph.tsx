import React, { useState } from 'react';
import { Bot, Layers, CheckCircle2, Clock, RefreshCw, X, ShieldAlert, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { SwarmNode } from '../types';

interface SwarmGraphProps {
  nodes: SwarmNode[];
  gateState: string;
}

export const SwarmGraph: React.FC<SwarmGraphProps> = ({ nodes, gateState }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const isBlocked = gateState === 'INTERCEPTED_BLOCK';
  const isApproved = gateState === 'OVERRIDE_APPROVED';

  const AGENT_ORDER = [
    { id: '@coordinator', role: 'Coordinator', defaultTurn: 14 },
    { id: '@backend', role: 'Backend Engineer', defaultTurn: 9 },
    { id: '@frontend', role: 'Frontend Consumer', defaultTurn: 8 },
    { id: '@verifier', role: 'Contract Verifier', defaultTurn: 12 },
  ];

  const agentCards = AGENT_ORDER.map((spec) => {
    const node = nodes.find((n) => n.id === spec.id) || {
      id: spec.id,
      name: spec.role,
      role: spec.role,
      status: spec.id === '@backend' && isBlocked ? 'drift_blocked' : 'clean',
      turn: spec.defaultTurn,
      messages: 20,
      lastAction: 'In-sync with locked contract baseline',
      avatarColor: '#6366f1',
    };
    return { ...node, roleTitle: spec.role };
  });

  const selectedNode = agentCards.find((n) => n.id === selectedNodeId) || null;

  const handleCardClick = (node: SwarmNode & { roleTitle: string }) => {
    if (selectedNodeId === node.id) {
      setSelectedNodeId(null);
    } else {
      setSelectedNodeId(node.id);
      toast.info(`Inspecting ${node.id} telemetry`, {
        description: `Role: ${node.roleTitle} · Turn #${node.turn}`,
        duration: 2000,
      });
    }
  };

  const getStatusDisplay = (node: SwarmNode) => {
    const isNodeBlocked = node.status === 'drift_blocked' || (node.id === '@backend' && isBlocked);

    if (isNodeBlocked) {
      return {
        dotClass: 'bg-rose-500 animate-pulse',
        textClass: 'text-rose-600 dark:text-rose-400',
        label: 'Drift Intercepted',
      };
    }

    if (isApproved && node.id === '@backend') {
      return {
        dotClass: 'bg-indigo-500',
        textClass: 'text-indigo-600 dark:text-indigo-400',
        label: 'Override Approved',
      };
    }

    if (node.status === 'waiting_fix') {
      return {
        dotClass: 'bg-amber-500',
        textClass: 'text-amber-600 dark:text-amber-400',
        label: 'Awaiting Review',
      };
    }

    if (node.status === 'verifying') {
      return {
        dotClass: 'bg-sky-500 animate-ping',
        textClass: 'text-sky-600 dark:text-sky-400',
        label: 'Verifying Contract',
      };
    }

    return {
      dotClass: 'bg-emerald-500',
      textClass: 'text-emerald-600 dark:text-emerald-400',
      label: 'Verified / Clean',
    };
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-[#1f2937] bg-white dark:bg-[#111827] p-5 shadow-sm space-y-4">
      {/* Pipeline Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#1f2937]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-sans">
              Agent Swarm Orchestration Pipeline
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-0.5">
              4 parallel agents coordinated under immutable schema consensus
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            4 Agents Monitored
          </span>
        </div>
      </div>

      {/* Row 3: 4-Column Horizontal Step Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {agentCards.map((node, index) => {
          const status = getStatusDisplay(node);
          const isNodeBlocked = node.status === 'drift_blocked' || (node.id === '@backend' && isBlocked);
          const isSelected = selectedNodeId === node.id;

          return (
            <div
              key={node.id}
              onClick={() => handleCardClick(node)}
              className={`rounded-xl border p-4 cursor-pointer transition-all duration-150 flex flex-col justify-between ${
                isNodeBlocked
                  ? 'border-rose-500/60 bg-rose-500/5 dark:bg-rose-950/20 hover:border-rose-500'
                  : isSelected
                  ? 'border-indigo-500/80 bg-indigo-50/40 dark:bg-indigo-950/20'
                  : 'border-slate-200 dark:border-[#1f2937] bg-slate-50/50 dark:bg-[#0d131f] hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div>
                {/* Step # and Role */}
                <div className="flex items-center justify-between gap-1.5 text-xs mb-2">
                  <span className="text-[11px] font-sans font-medium text-slate-500 dark:text-slate-400 truncate" title={`Step ${index + 1}: ${node.roleTitle}`}>
                    Step {index + 1}: {node.roleTitle}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 whitespace-nowrap shrink-0">
                    Turn #{node.turn}
                  </span>
                </div>

                {/* Agent Handle */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 shrink-0">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                    {node.id}
                  </span>
                </div>
              </div>

              {/* Status Dot + Label (Strictly 1, whitespace-nowrap, zero collision) */}
              <div className="pt-2.5 border-t border-slate-100 dark:border-[#1f2937] flex items-center">
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${status.textClass}`}>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${status.dotClass}`} />
                  <span>{status.label}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Agent Telemetry Drawer */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#1f2937] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#1f2937]">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
                    {selectedNode.id}
                  </span>
                  <span className="text-xs text-slate-600 dark:text-slate-300 font-medium font-sans">
                    — {selectedNode.roleTitle}
                  </span>
                  <span className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    Telemetry Stream
                  </span>
                </div>
                <button
                  onClick={() => setSelectedNodeId(null)}
                  className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Close telemetry view"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#1f2937]">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-sans">
                    Messages Processed
                  </span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-sans">
                    {selectedNode.messages} messages
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#1f2937]">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-sans">
                    Execution Turn
                  </span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-sans">
                    Turn #{selectedNode.turn}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#1f2937]">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-sans">
                    Current Policy Gate Status
                  </span>
                  <span className="text-sm font-semibold font-sans">
                    {selectedNode.id === '@backend' && isBlocked ? (
                      <span className="text-rose-600 dark:text-rose-400 font-semibold whitespace-nowrap">
                        Contract Drift Intercepted
                      </span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold whitespace-nowrap">
                        Verified / Clean
                      </span>
                    )}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#1f2937]">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1 font-sans">
                  Latest Action / Payload:
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-mono bg-slate-50 dark:bg-black/40 p-2 rounded border border-slate-200 dark:border-slate-800">
                  {selectedNode.lastAction}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
