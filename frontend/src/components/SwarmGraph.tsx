import React, { useState, useRef } from 'react';
import { Bot, Shield, AlertOctagon, CheckCircle2, Clock, MessageSquare, Activity, Zap, RefreshCw } from 'lucide-react';
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
  const sentinelRef = useRef<HTMLDivElement>(null);

  const isBlocked = gateState === 'INTERCEPTED_BLOCK';

  const getNodeStatusBadge = (status: string) => {
    switch (status) {
      case 'drift_blocked':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded badge-crimson font-bold uppercase tracking-wider animate-pulse">
            <AlertOctagon className="w-3 h-3" />
            DRIFT BLOCKED
          </span>
        );
      case 'waiting_fix':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded badge-amber font-bold uppercase tracking-wider">
            <Clock className="w-3 h-3" />
            WAITING FIX
          </span>
        );
      case 'verifying':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded badge-verified font-bold uppercase tracking-wider">
            <RefreshCw className="w-3 h-3 animate-spin" />
            VERIFYING
          </span>
        );
      case 'clean':
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded badge-verified font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-3 h-3" />
            CONTRACT SYNC
          </span>
        );
    }
  };

  return (
    <div className="cyber-card p-5 relative overflow-hidden flex flex-col justify-between">
      {/* Background Grid Pattern & Tactical Watermark */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-25 pointer-events-none" />
      <div className="absolute -right-8 -bottom-8 text-obsidian-700/20 font-mono text-8xl font-black select-none pointer-events-none">
        TOPOLOGY
      </div>

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-obsidian-600 z-10">
        <div className="flex items-center gap-2.5">
          <Activity className="w-4 h-4 text-cyber-cyan animate-pulse" />
          <h2 className="font-mono text-xs font-bold tracking-wider uppercase text-slate-200">
            Swarm Orchestration Topology // Interceptor Mesh
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-cyber-emerald animate-ping" />
          <span className="text-[11px] font-mono text-slate-400">
            {nodes.length} AGENTS ACTIVE
          </span>
        </div>
      </div>

      {/* Main Interactive Topology Visualizer */}
      <div ref={containerRef} className="relative py-6 my-2 min-h-[380px] flex items-center justify-center">
        {/* Magic UI Animated Beams */}
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={coordRef}
          toRef={sentinelRef}
          duration={3}
          gradientStartColor="#06b6d4"
          gradientStopColor="#8b5cf6"
        />
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={sentinelRef}
          toRef={backendRef}
          duration={3.5}
          gradientStartColor={isBlocked ? "#ef4444" : "#10b981"}
          gradientStopColor={isBlocked ? "#ef4444" : "#06b6d4"}
        />
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={sentinelRef}
          toRef={frontendRef}
          duration={4}
          gradientStartColor="#06b6d4"
          gradientStopColor="#10b981"
        />
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={sentinelRef}
          toRef={verifierRef}
          duration={3.2}
          gradientStartColor="#10b981"
          gradientStopColor="#06b6d4"
        />

        {/* SVG Network Vector Connection Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="redGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Central Hub Cross Connections */}
          {/* Coordinator (center top) to Center Interceptor */}
          <line
            x1="50%"
            y1="18%"
            x2="50%"
            y2="50%"
            stroke="#06b6d4"
            strokeWidth="2"
            strokeDasharray="4 4"
            className="animate-pulse"
          />

          {/* Center Interceptor to Backend (left) */}
          <line
            x1="50%"
            y1="50%"
            x2="22%"
            y2="50%"
            stroke={isBlocked ? '#ef4444' : '#10b981'}
            strokeWidth={isBlocked ? '3' : '2'}
            strokeDasharray={isBlocked ? '6 3' : '4 4'}
          />

          {/* Center Interceptor to Frontend (right) */}
          <line
            x1="50%"
            y1="50%"
            x2="78%"
            y2="50%"
            stroke={isBlocked ? '#f59e0b' : '#06b6d4'}
            strokeWidth="2"
            strokeDasharray="4 4"
          />

          {/* Center Interceptor to Verifier (bottom) */}
          <line
            x1="50%"
            y1="50%"
            x2="50%"
            y2="82%"
            stroke="#10b981"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
        </svg>

        {/* Central Sentinel: SWARMGUARD INTERCEPTOR */}
        <div ref={sentinelRef} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center">
          <div
            className={`relative flex items-center justify-center w-16 h-16 rounded-full border-2 transition-all ${
              isBlocked
                ? 'bg-obsidian-900 border-cyber-crimson shadow-glow-crimson'
                : 'bg-obsidian-900 border-cyber-cyan shadow-glow-cyan'
            }`}
          >
            <Shield
              className={`w-7 h-7 ${isBlocked ? 'text-cyber-crimson animate-bounce' : 'text-cyber-cyan'}`}
            />
            {isBlocked && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-crimson opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-cyber-crimson"></span>
              </span>
            )}
          </div>
          <div className="mt-2 text-center">
            <span
              className={`text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded uppercase ${
                isBlocked
                  ? 'bg-cyber-crimson/20 text-cyber-crimson border border-cyber-crimson/40'
                  : 'bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/40'
              }`}
            >
              {isBlocked ? 'INTERCEPTOR // HELD' : 'SWARMGUARD GATE'}
            </span>
          </div>
        </div>

        {/* Grid Positioning of the 4 Workers */}
        <div className="w-full h-full relative z-10 flex flex-col justify-between items-center gap-12">
          {/* Node 1: @coordinator (Top Center) */}
          {(() => {
            const coord = nodes.find((n) => n.id === '@coordinator') || nodes[0];
            return (
              <div
                ref={coordRef}
                onClick={() => setSelectedNode(coord)}
                className="cursor-pointer group flex flex-col items-center transform transition-transform hover:scale-105"
              >
                <div className="relative flex items-center gap-2 p-2.5 rounded-xl bg-obsidian-800/90 border border-cyber-cyan/50 shadow-glow-cyan hover:border-cyber-cyan">
                  <div className="w-8 h-8 rounded-lg bg-cyber-cyan/20 flex items-center justify-center text-cyber-cyan">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-slate-100">{coord.id}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-obsidian-950 text-slate-400 border border-obsidian-700">
                        TURN {coord.turn}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">{coord.role}</div>
                  </div>
                </div>
                <div className="mt-1">{getNodeStatusBadge(coord.status)}</div>
              </div>
            );
          })()}

          {/* Middle Row: @backend (Left) and @frontend (Right) */}
          <div className="w-full flex items-center justify-between px-2 sm:px-8">
            {/* Node 2: @backend (Left) */}
            {(() => {
              const backend = nodes.find((n) => n.id === '@backend') || nodes[1];
              const isNodeBlocked = backend.status === 'drift_blocked' || isBlocked;
              return (
                <div
                  ref={backendRef}
                  onClick={() => setSelectedNode(backend)}
                  className="cursor-pointer group flex flex-col items-start transform transition-transform hover:scale-105 max-w-[200px]"
                >
                  <div
                    className={`relative flex items-center gap-2 p-2.5 rounded-xl bg-obsidian-800/90 border transition-all ${
                      isNodeBlocked
                        ? 'border-cyber-crimson shadow-glow-crimson'
                        : 'border-obsidian-600 hover:border-cyber-cyan'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isNodeBlocked ? 'bg-cyber-crimson/20 text-cyber-crimson' : 'bg-obsidian-700 text-slate-300'
                      }`}
                    >
                      <Bot className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-slate-100">{backend.id}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-obsidian-950 text-slate-400 border border-obsidian-700">
                          T{backend.turn}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">{backend.name}</div>
                    </div>
                  </div>
                  <div className="mt-1">{getNodeStatusBadge(backend.status)}</div>
                </div>
              );
            })()}

            {/* Node 3: @frontend (Right) */}
            {(() => {
              const fe = nodes.find((n) => n.id === '@frontend') || nodes[2];
              return (
                <div
                  ref={frontendRef}
                  onClick={() => setSelectedNode(fe)}
                  className="cursor-pointer group flex flex-col items-end transform transition-transform hover:scale-105 max-w-[200px]"
                >
                  <div className="relative flex items-center gap-2 p-2.5 rounded-xl bg-obsidian-800/90 border border-obsidian-600 hover:border-cyber-cyan transition-all">
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-obsidian-950 text-slate-400 border border-obsidian-700">
                          T{fe.turn}
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-100">{fe.id}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">{fe.name}</div>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-cyber-amber/20 text-cyber-amber flex items-center justify-center">
                      <Bot className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-1">{getNodeStatusBadge(fe.status)}</div>
                </div>
              );
            })()}
          </div>

          {/* Node 4: @verifier (Bottom Center) */}
          {(() => {
            const verifier = nodes.find((n) => n.id === '@verifier') || nodes[3];
            return (
              <div
                ref={verifierRef}
                onClick={() => setSelectedNode(verifier)}
                className="cursor-pointer group flex flex-col items-center transform transition-transform hover:scale-105"
              >
                <div className="relative flex items-center gap-2 p-2.5 rounded-xl bg-obsidian-800/90 border border-cyber-emerald/50 shadow-glow-emerald hover:border-cyber-emerald">
                  <div className="w-8 h-8 rounded-lg bg-cyber-emerald/20 flex items-center justify-center text-cyber-emerald">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-slate-100">{verifier.id}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-obsidian-950 text-slate-400 border border-obsidian-700">
                        TURN {verifier.turn}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">{verifier.role}</div>
                  </div>
                </div>
                <div className="mt-1">{getNodeStatusBadge(verifier.status)}</div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Node Details Inspection Drawer */}
      {selectedNode && (
        <div className="mt-4 p-3 rounded-lg bg-obsidian-950 border border-obsidian-700 text-xs font-mono space-y-2 animate-fade-in">
          <div className="flex items-center justify-between border-b border-obsidian-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-cyber-cyan">{selectedNode.id}</span>
              <span className="text-slate-400">// {selectedNode.role}</span>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-slate-500 hover:text-slate-200 px-1.5 rounded"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-slate-500">MESSAGES PROCESSED: </span>
              <span className="text-slate-200 font-bold">{selectedNode.messages}</span>
            </div>
            <div>
              <span className="text-slate-500">CURRENT TURN: </span>
              <span className="text-slate-200 font-bold">#{selectedNode.turn}</span>
            </div>
          </div>
          <div className="text-[11px]">
            <span className="text-slate-500">LAST TELEMETRY ACTION: </span>
            <span className="text-slate-300">{selectedNode.lastAction}</span>
          </div>
        </div>
      )}
    </div>
  );
};
