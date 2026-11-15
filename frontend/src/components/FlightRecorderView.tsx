import React, { useState } from 'react';
import {
  Database,
  ShieldCheck,
  ShieldAlert,
  ArrowDown,
  Lock,
  Bug,
  RotateCcw,
  CheckCircle2,
  FileText,
  ChevronRight,
  Eye,
  FileCode,
  Copy,
  Check,
  Sparkles,
  Bot,
  UserCheck,
  Activity,
  Layers,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { Block, VerificationResult } from '../types';

interface FlightRecorderViewProps {
  blocks: Block[];
  verification: VerificationResult;
  onTamperBlock: (index: number) => Promise<void>;
  onRestoreAndVerify: () => Promise<void>;
  loading: boolean;
}

export const FlightRecorderView: React.FC<FlightRecorderViewProps> = ({
  blocks,
  verification,
  onTamperBlock,
  onRestoreAndVerify,
  loading,
}) => {
  const [viewMode, setViewMode] = useState<'executive' | 'crypto'>('executive');
  const [expandedBlockIndex, setExpandedBlockIndex] = useState<number | null>(null);
  const [copiedHashIndex, setCopiedHashIndex] = useState<number | null>(null);

  const isTampered = !verification.valid;
  const tamperedIndex = verification.tampered_block_index;

  const handleCopyHash = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedHashIndex(idx);
    toast.success('Block cryptographic hash copied to clipboard');
    setTimeout(() => setCopiedHashIndex(null), 2000);
  };

  const handleTamperClick = async (index: number) => {
    toast.error(`Simulating tamper attack on Block #${index}...`, {
      description: 'Injecting modified payload without updating chained SHA-256 micro-hash.',
    });
    await onTamperBlock(index);
  };

  const handleRestoreClick = async () => {
    toast.success('Restoring clean audit ledger...', {
      description: 'Re-verifying all SHA-256 chained hashes and Argon2id milestone seals.',
    });
    await onRestoreAndVerify();
  };

  const getExecutiveEventTitle = (block: Block) => {
    const act = block.action_type.toUpperCase();
    if (act.includes('GENESIS') || act.includes('LOCK')) {
      return 'OpenAPI Contract Baseline Locked';
    }
    if (act.includes('DRIFT') || act.includes('INTERCEPT')) {
      return 'Contract Drift Intercepted at Policy Gate';
    }
    if (act.includes('FIX') || act.includes('AUTO_FIX')) {
      return 'Gemini 2.5 Backwards-Compatibility Fix Applied';
    }
    if (act.includes('OVERRIDE')) {
      return 'Executive Override Approved & Cryptographically Sealed';
    }
    if (act.includes('ROLLBACK')) {
      return 'Rollback Directive Executed';
    }
    if (act.includes('MUTATION') || act.includes('PATCH')) {
      return 'Backend Schema Mutation Recorded';
    }
    return `Agent Action: ${block.action_type.replace(/_/g, ' ')}`;
  };

  const getExecutiveDescription = (block: Block) => {
    if (block.payload_preview) {
      return block.payload_preview;
    }
    return `Telemetry event recorded by ${block.worker_id} under verified consensus.`;
  };

  const getAgentRoleBadge = (workerId: string) => {
    if (workerId.includes('coordinator')) {
      return {
        label: 'Orchestrator',
        icon: <Bot className="w-3.5 h-3.5 text-indigo-500" />,
        bg: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20',
      };
    }
    if (workerId.includes('backend')) {
      return {
        label: 'Backend Engineer',
        icon: <Bot className="w-3.5 h-3.5 text-amber-500" />,
        bg: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
      };
    }
    if (workerId.includes('frontend')) {
      return {
        label: 'Frontend Engineer',
        icon: <Bot className="w-3.5 h-3.5 text-sky-500" />,
        bg: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20',
      };
    }
    if (workerId.includes('verifier') || workerId.includes('quality')) {
      return {
        label: 'Quality Verifier',
        icon: <Activity className="w-3.5 h-3.5 text-emerald-500" />,
        bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
      };
    }
    return {
      label: 'Security Auditor',
      icon: <UserCheck className="w-3.5 h-3.5 text-purple-500" />,
      bg: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20',
    };
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/75 backdrop-blur-xl shadow-sm p-5 space-y-5">
      {/* Flight Recorder Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Cryptographic Audit Ledger & Flight Recorder
              </h2>
              <span className="text-[11px] font-sans px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium">
                {blocks.length} Blocks Verified
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Append-only immutable event timeline · SHA-256 micro-hashing · Argon2id memory-hard milestone proofs
            </p>
          </div>
        </div>

        {/* View Mode Toggle & Status Actions */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          {/* Segmented Toggle: Executive vs Cryptographic */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium">
            <button
              onClick={() => {
                setViewMode('executive');
                toast.info('Switched to Executive Audit View');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'executive'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Executive View</span>
            </button>
            <button
              onClick={() => {
                setViewMode('crypto');
                toast.info('Switched to Cryptographic Proof View');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'crypto'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Cryptographic Proof View</span>
            </button>
          </div>

          {/* Chain Integrity Status Badge */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
              isTampered
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
            }`}
          >
            {isTampered ? (
              <>
                <ShieldAlert className="w-4 h-4 shrink-0 animate-pulse text-rose-500" />
                <span>Integrity Alert: Block #{tamperedIndex}</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>Verified / Clean (100%)</span>
              </>
            )}
          </div>

          {/* Restore & Re-Verify Button */}
          <button
            onClick={handleRestoreClick}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300/80 dark:border-slate-700 text-xs font-medium transition-colors disabled:opacity-50"
            title="Restore pristine uncompromised blockchain and re-verify all cryptographic hashes"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Restore Clean Ledger</span>
          </button>
        </div>
      </div>

      {/* Compromised Alert Banner */}
      {isTampered && (
        <div className="p-4 rounded-xl bg-rose-500/10 dark:bg-rose-500/15 border-2 border-rose-500/80 text-rose-900 dark:text-rose-200 flex items-start gap-3.5">
          <ShieldAlert className="w-6 h-6 text-rose-500 shrink-0 mt-0.5 animate-bounce" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
              Cryptographic Tamper Attack Detected
            </h4>
            <p className="text-xs text-slate-800 dark:text-slate-200">
              Payload at <strong className="font-mono text-rose-600 dark:text-rose-400">Block #{tamperedIndex}</strong> was modified out-of-band!
              Because SHA-256 micro-hashing mathematically binds each block to its ancestor, all subsequent blocks fail hash validation.
            </p>
            <div className="pt-1">
              <button
                onClick={handleRestoreClick}
                className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition-colors"
              >
                Restore Clean Ledger & Re-verify
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 1: EXECUTIVE AUDIT VIEW */}
      {viewMode === 'executive' && (
        <div className="space-y-3">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center justify-between px-1">
            <span>Enterprise Compliance Event Stream</span>
            <span>Real-time Consensus Log</span>
          </div>

          <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 pl-6 space-y-6 my-4">
            {blocks.map((block) => {
              const role = getAgentRoleBadge(block.worker_id);
              const isDirectlyTampered = isTampered && tamperedIndex === block.index;

              return (
                <div key={block.index} className="relative group">
                  {/* Timeline Node Dot */}
                  <div
                    className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 bg-white dark:bg-slate-900 flex items-center justify-center ${
                      isDirectlyTampered
                        ? 'border-rose-500 bg-rose-500/20'
                        : block.argon2_seal
                        ? 'border-indigo-500 bg-indigo-500/20'
                        : 'border-emerald-500 bg-emerald-500/20'
                    }`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        isDirectlyTampered
                          ? 'bg-rose-500'
                          : block.argon2_seal
                          ? 'bg-indigo-500'
                          : 'bg-emerald-500'
                      }`}
                    />
                  </div>

                  {/* Executive Card */}
                  <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800/60">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                          {getExecutiveEventTitle(block)}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-sans font-medium border ${role.bg}`}
                        >
                          {role.icon}
                          {role.label} ({block.worker_id})
                        </span>
                        {block.argon2_seal && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-sans font-semibold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                            <Lock className="w-3 h-3" />
                            Milestone Sealed
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
                        <span>Block #{block.index}</span>
                        <span>·</span>
                        <span>{new Date(block.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 font-sans mt-2 leading-relaxed">
                      {getExecutiveDescription(block)}
                    </p>

                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/40">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Verified by SwarmGuard Consensus
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setViewMode('crypto');
                          setExpandedBlockIndex(block.index);
                        }}
                        className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
                      >
                        <span>View Cryptographic Proof</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW MODE 2: CRYPTOGRAPHIC PROOF VIEW */}
      {viewMode === 'crypto' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
            <span>Cryptographic Merkle Linkage & Key-Stretched Proofs</span>
            <span>Deterministic SHA-256 Hashes</span>
          </div>

          <div className="space-y-4">
            {blocks.map((block, i) => {
              const isThisBlockTampered =
                isTampered && tamperedIndex !== null && block.index >= tamperedIndex;
              const isDirectlyModified = isTampered && tamperedIndex === block.index;
              const isExpanded = expandedBlockIndex === block.index;

              return (
                <div key={block.index} className="relative">
                  {/* Chained Connector Line */}
                  {i > 0 && (
                    <div className="flex items-center justify-center my-1">
                      <div
                        className={`h-5 w-0.5 ${
                          isThisBlockTampered ? 'bg-rose-500' : 'bg-indigo-400/50'
                        }`}
                      />
                      <div className="absolute left-6 sm:left-10 text-[10px] font-mono text-slate-400 flex items-center gap-1">
                        <ArrowDown className="w-3 h-3" />
                        <span>sha256(prev_hash)</span>
                      </div>
                    </div>
                  )}

                  {/* Block Card */}
                  <div
                    className={`rounded-2xl border transition-all duration-200 ${
                      isDirectlyModified
                        ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-500 shadow-md shadow-rose-500/10'
                        : isThisBlockTampered
                        ? 'bg-slate-50 dark:bg-slate-950 border-rose-400/50'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {/* Block Header */}
                    <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-start sm:items-center gap-3">
                        {/* Block Index Badge */}
                        <div
                          className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl font-mono font-bold border shrink-0 ${
                            isThisBlockTampered
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <span className="text-[10px] text-slate-500 font-normal">BLOCK</span>
                          <span className="text-sm">#{block.index}</span>
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">
                              {block.worker_id}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                              {block.action_type}
                            </span>
                            {block.argon2_seal && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                                <Lock className="w-3 h-3" />
                                Argon2id Milestone Seal
                              </span>
                            )}
                            {isDirectlyModified && (
                              <span className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold border border-rose-500/30">
                                Tamper Injected Here
                              </span>
                            )}
                            {isThisBlockTampered && !isDirectlyModified && (
                              <span className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                Broken Hash Link
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-300 font-sans mt-1">
                            {block.payload_preview}
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons for this Block */}
                      <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                        <button
                          onClick={() => handleTamperClick(block.index)}
                          disabled={loading}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-500/10 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-300 dark:border-slate-700 hover:border-rose-400 text-xs font-sans font-medium transition-colors flex items-center gap-1.5"
                          title="Simulate malicious tampering of this block's data"
                        >
                          <Bug className="w-3.5 h-3.5 text-rose-500" />
                          <span>Simulate Tamper Attack</span>
                        </button>

                        <button
                          onClick={() => setExpandedBlockIndex(isExpanded ? null : block.index)}
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs border border-slate-300 dark:border-slate-700 transition-colors"
                          title="Inspect raw cryptographic JSON record"
                        >
                          <FileCode className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Hashes Summary Strip */}
                    <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 text-[11px] font-mono flex flex-col md:flex-row md:items-center justify-between gap-2 text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-slate-400">BLOCK HASH:</span>
                        <span
                          className={`font-semibold truncate ${
                            isThisBlockTampered
                              ? 'text-rose-600 dark:text-rose-400 line-through'
                              : 'text-indigo-600 dark:text-indigo-400'
                          }`}
                        >
                          {block.block_hash}
                        </span>
                        <button
                          onClick={() => handleCopyHash(block.block_hash, block.index)}
                          className="hover:text-slate-700 dark:hover:text-slate-200"
                          title="Copy hash"
                        >
                          {copiedHashIndex === block.index ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-slate-400">PREV HASH:</span>
                          <span className="text-slate-600 dark:text-slate-400 truncate">
                            {block.prev_hash.slice(0, 16)}...
                          </span>
                        </div>
                        <span className="text-slate-400">
                          {new Date(block.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>

                    {/* Expanded Raw Inspector */}
                    {isExpanded && (
                      <div className="p-4 bg-slate-950 border-t border-slate-800 font-mono text-xs space-y-2">
                        <div className="text-slate-400 text-[11px] font-bold">
                          RAW CRYPTOGRAPHIC LEDGER RECORD:
                        </div>
                        <pre className="p-3 rounded-lg bg-slate-900 text-slate-200 text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
                          {JSON.stringify(block, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
