import React, { useState, useRef } from 'react';
import {
  Bot,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Cpu,
  Layers,
  Terminal,
  Sparkles,
  X,
  Activity,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { SwarmNode } from '../types';
import { AnimatedBeam } from './ui/animated-beam';

interface SwarmGraphProps {
  nodes: SwarmNode[];
  gateState: string;
}

export const SwarmGraph: React.FC<SwarmGraphProps> = ({ nodes, gateState }) => {
  const [selectedNode, setSelectedNode] = useState<SwarmNode | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const coordRef = useRef<HTMLDivElement>(null);
  const backendRef = useRef<HTMLDivElement>(null);
  const frontendRef = useRef<HTMLDivElement>(null);
  const verifierRef = useRef<HTMLDivElement>(null);
  const firewallRef = useRef<HTMLDivElement>(null);

  const isBlocked = gateState === 'INTERCEPTED_BLOCK';
  const isApproved = gateState === 'OVERRIDE_APPROVED';

  const handleSelectNode = (node: SwarmNode) => {
    setSelectedNode(node);
    toast.info(`Inspecting agent ${node.id}`, {
      description: `Role: ${getRoleTitle(node.id)} | Turn #${node.turn}`,
      duration: 2500,
    });
  };

  const getRoleTitle = (id: string) => {
    switch (id) {
      case '@coordinator':
        return 'Orchestrator Agent';
      case '@backend':
        return 'Backend Engineer Agent';
      case '@frontend':
        return 'Frontend Engineer Agent';
      case '@verifier':
        return 'Quality & Contract Verifier';
      default:
        return 'Swarm Worker Agent';
    }
  };

  const getRoleDescription = (id: string) => {
    switch (id) {
      case '@coordinator':
        return 'Managing Swarm Consensus & Task Allocation';
      case '@backend':
        return isBlocked
          ? 'Editing Checkout API — Breaking Drift Intercepted'
          : 'Refactoring Checkout API Endpoint';
      case '@frontend':
        return 'Consuming Checkout API Contract';
      case '@verifier':
        return 'Auditing Schemas & Automated Test Assertions';
      default:
        return 'Parallel Worker Execution';
    }
  };

  const getNodeStatusBadge = (node: SwarmNode) => {
    const isNodeBlocked = node.status === 'drift_blocked' || (node.id === '@backend' && isBlocked);

    if (isNodeBlocked) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-sans font-medium bg-rose-500/10 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          Drift Intercepted
        </span>
      );
    }

    if (isApproved && node.id === '@backend') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-sans font-medium bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
          <Check className="w-3 h-3" />
          Override Approved
        </span>
      );
    }

    switch (node.status) {
      case 'waiting_fix':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-sans font-medium bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3" />
            Awaiting Review
          </span>
        );
      case 'verifying':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-sans font-medium bg-sky-500/10 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Verifying Contract
          </span>
        );
      case 'clean':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-sans font-medium bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            Verified / Clean
          </span>
        );
    }
  };

  const coordNode = nodes.find((n) => n.id === '@coordinator') || nodes[0];
  const backendNode = nodes.find((n) => n.id === '@backend') || nodes[1];
  const frontendNode = nodes.find((n) => n.id === '@frontend') || nodes[2];
  const verifierNode = nodes.find((n) => n.id === '@verifier') || nodes[3];

  return (
    <div className="relative rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/75 backdrop-blur-xl shadow-sm p-5 overflow-hidden flex flex-col justify-between">
      {/* Background Subtle Tech Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:20px_20px] opacity-20 pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200 dark:border-slate-800 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Agent Swarm Orchestration Graph
              <span className="text-[11px] font-medium font-sans px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Active Contract Verifier
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Real-time multi-agent communication topology monitored through central policy gateway
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            4 Agents Monitored
          </span>
        </div>
      </div>

      {/* Main Interactive Visualizer */}
      <div ref={containerRef} className="relative py-8 my-2 min-h-[420px] flex items-center justify-center">
        {/* Animated Beams Through Central Policy Firewall */}
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={coordRef}
          toRef={firewallRef}
          duration={3.2}
          gradientStartColor="#6366f1"
          gradientStopColor="#06b6d4"
        />
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={firewallRef}
          toRef={backendRef}
          duration={isBlocked ? 2 : 3.5}
          gradientStartColor={isBlocked ? '#f43f5e' : '#10b981'}
          gradientStopColor={isBlocked ? '#fb7185' : '#06b6d4'}
        />
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={firewallRef}
          toRef={frontendRef}
          duration={3.8}
          gradientStartColor="#06b6d4"
          gradientStopColor="#10b981"
        />
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={firewallRef}
          toRef={verifierRef}
          duration={3.4}
          gradientStartColor="#10b981"
          gradientStopColor="#6366f1"
        />

        {/* Central Policy Gateway Node */}
        <div
          ref={firewallRef}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center"
        >
          <div
            className={`relative flex items-center justify-center w-16 h-16 rounded-2xl border-2 transition-all duration-300 shadow-md ${
              isBlocked
                ? 'bg-rose-50/90 dark:bg-slate-900 border-rose-500 text-rose-600 dark:text-rose-400 shadow-rose-500/20'
                : 'bg-white/90 dark:bg-slate-900 border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-indigo-500/20'
            }`}
          >
            <Shield className={`w-8 h-8 ${isBlocked ? 'animate-bounce text-rose-500' : 'text-indigo-500'}`} />
            {isBlocked && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-600"></span>
              </span>
            )}
          </div>
          <div className="mt-2.5 text-center">
            <span
              className={`text-[11px] font-sans font-semibold tracking-tight px-2.5 py-0.5 rounded-full border shadow-sm ${
                isBlocked
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                  : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30'
              }`}
            >
              {isBlocked ? 'Policy Gate // Traffic Held' : 'SwarmGuard Policy Gate'}
            </span>
          </div>
        </div>

        {/* Topology Node Grid Layout */}
        <div className="w-full h-full relative z-10 flex flex-col justify-between items-center gap-14">
          {/* Top Node: @coordinator */}
          {coordNode && (
            <motion.div
              ref={coordRef}
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => handleSelectNode(coordNode)}
              className="cursor-pointer group flex flex-col items-center max-w-[280px]"
            >
              <div className="relative flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-500/60 transition-all">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                      {coordNode.id}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      Turn #{coordNode.turn}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {getRoleTitle(coordNode.id)}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {getRoleDescription(coordNode.id)}
                  </div>
                </div>
              </div>
              <div className="mt-1.5">{getNodeStatusBadge(coordNode)}</div>
            </motion.div>
          )}

          {/* Middle Row: @backend (Left) and @frontend (Right) */}
          <div className="w-full flex items-center justify-between px-2 sm:px-6">
            {/* Left Node: @backend */}
            {backendNode && (
              <motion.div
                ref={backendRef}
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => handleSelectNode(backendNode)}
                className="cursor-pointer group flex flex-col items-start max-w-[270px]"
              >
                <div
                  className={`relative flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900/90 border transition-all shadow-sm hover:shadow-md ${
                    isBlocked
                      ? 'border-rose-500/80 shadow-rose-500/10 dark:shadow-rose-950/20 bg-rose-50/30 dark:bg-slate-900'
                      : 'border-slate-200/90 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      isBlocked
                        ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                    }`}
                  >
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                        {backendNode.id}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        Turn #{backendNode.turn}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {getRoleTitle(backendNode.id)}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {getRoleDescription(backendNode.id)}
                    </div>
                  </div>
                </div>
                <div className="mt-1.5">{getNodeStatusBadge(backendNode)}</div>
              </motion.div>
            )}

            {/* Right Node: @frontend */}
            {frontendNode && (
              <motion.div
                ref={frontendRef}
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => handleSelectNode(frontendNode)}
                className="cursor-pointer group flex flex-col items-end max-w-[270px]"
              >
                <div className="relative flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-sky-500/60 transition-all text-right">
                  <div className="min-w-0">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        Turn #{frontendNode.turn}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                        {frontendNode.id}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {getRoleTitle(frontendNode.id)}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {getRoleDescription(frontendNode.id)}
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/20">
                    <Bot className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-1.5">{getNodeStatusBadge(frontendNode)}</div>
              </motion.div>
            )}
          </div>

          {/* Bottom Node: @verifier */}
          {verifierNode && (
            <motion.div
              ref={verifierRef}
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => handleSelectNode(verifierNode)}
              className="cursor-pointer group flex flex-col items-center max-w-[280px]"
            >
              <div className="relative flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-emerald-500/60 transition-all">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                  <Activity className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                      {verifierNode.id}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      Turn #{verifierNode.turn}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {getRoleTitle(verifierNode.id)}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {getRoleDescription(verifierNode.id)}
                  </div>
                </div>
              </div>
              <div className="mt-1.5">{getNodeStatusBadge(verifierNode)}</div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Node Details Inspection Drawer / Card */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-xs space-y-3"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {selectedNode.id}
                </span>
                <span className="text-slate-600 dark:text-slate-300 font-medium font-sans">
                  — {getRoleTitle(selectedNode.id)}
                </span>
                <span className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  Live Telemetry
                </span>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                aria-label="Close telemetry view"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-sans">
                  Messages Processed
                </span>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-sans">
                  {selectedNode.messages} messages
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-sans">
                  Current Execution Turn
                </span>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-sans">
                  Turn #{selectedNode.turn}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-sans">
                  Policy Status
                </span>
                <span className="text-sm font-semibold font-sans">
                  {selectedNode.id === '@backend' && isBlocked ? (
                    <span className="text-rose-600 dark:text-rose-400 font-semibold">
                      Contract Drift Intercepted
                    </span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      Clean & Compliant
                    </span>
                  )}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1 font-sans">
                Latest Telemetry Action:
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-mono bg-slate-100 dark:bg-slate-950 p-2 rounded border border-slate-200 dark:border-slate-850">
                {selectedNode.lastAction}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
