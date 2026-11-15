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
  FileCode,
  Copy,
  Check,
  Bot,
  UserCheck,
  Activity,
} from 'lucide-react';
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
      description: 'Modified payload without updating chained SHA-256 hash.',
    });
    await onTamperBlock(index);
  };

  const handleRestoreClick = async () => {
    toast.success('Restoring clean audit ledger...', {
      description: 'Re-verifying all SHA-256 chained hashes and Argon2id milestone proofs.',
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
      return 'Executive Override Approved & Sealed';
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
        label: 'Frontend Consumer',
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
    <div className="rounded-xl border border-slate-200 dark:border-[#1f2937] bg-white dark:bg-[#111827] p-6 shadow-sm space-y-5">
      {/* Flight Recorder Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-[#1f2937]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 shrink-0">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-sans">
                Cryptographic Audit Ledger & Flight Recorder
              </h2>
              <span className="text-[11px] font-sans px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-medium whitespace-nowrap">
                {blocks.length} Blocks Verified
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-0.5">
              Append-only immutable event timeline · SHA-256 micro-hashing · Argon2id milestone proofs
            </p>
          </div>
        </div>

        {/* View Mode Toggle & Status Actions */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto whitespace-nowrap">
          {/* Segmented Toggle: Executive vs Cryptographic */}
          <div className="flex items-center p-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium">
            <button
              onClick={() => {
                setViewMode('executive');
                toast.info('Switched to Executive Audit View');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
                viewMode === 'executive'
                  ? 'bg-white dark:bg-[#111827] text-slate-900 dark:text-slate-100 shadow-sm font-semibold'
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
                viewMode === 'crypto'
                  ? 'bg-white dark:bg-[#111827] text-slate-900 dark:text-slate-100 shadow-sm font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Cryptographic Proof View</span>
            </button>
          </div>

          {/* Chain Integrity Status Badge */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border whitespace-nowrap ${
              isTampered
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
            }`}
          >
            {isTampered ? (
              <>
                <ShieldAlert className="w-3.5 h-3.5 shrink-0 animate-pulse text-rose-500" />
                <span>Integrity Alert: Block #{tamperedIndex}</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                <span>Verified / Clean</span>
              </>
            )}
          </div>

          {/* Restore & Re-Verify Button */}
          <button
            onClick={handleRestoreClick}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-sans font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
            title="Restore uncompromised blockchain and re-verify all cryptographic hashes"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Restore Clean Ledger</span>
          </button>
        </div>
      </div>

      {/* Compromised Alert Banner */}
      {isTampered && (
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/40 text-rose-900 dark:text-rose-200 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5 animate-pulse" />
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider font-sans">
              Cryptographic Tamper Attack Detected
            </h4>
            <p className="text-xs text-slate-800 dark:text-slate-200 font-sans">
              Payload at <strong className="font-mono text-rose-600 dark:text-rose-400">Block #{tamperedIndex}</strong> was modified out-of-band. Because SHA-256 micro-hashing mathematically binds each block to its predecessor, all subsequent blocks fail integrity verification.
            </p>
            <div className="pt-1">
              <button
                onClick={handleRestoreClick}
                className="px-3 py-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-sans font-medium transition-colors whitespace-nowrap"
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
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center justify-between px-1 font-sans">
            <span>Enterprise Compliance Event Stream</span>
            <span>Real-time Consensus Log</span>
          </div>

          <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-3 pl-5 space-y-4 my-2">
            {blocks.map((block) => {
              const role = getAgentRoleBadge(block.worker_id);
              const isDirectlyTampered = isTampered && tamperedIndex === block.index;

              // At most one status pill:
              let statusPill = null;
              if (isDirectlyTampered) {
                statusPill = (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-sans font-medium bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 whitespace-nowrap">
                    Tamper Detected
                  </span>
                );
              } else if (block.argon2_seal) {
                statusPill = (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-sans font-medium bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 whitespace-nowrap">
                    <Lock className="w-2.5 h-2.5" />
                    Milestone Sealed
                  </span>
                );
              }

              return (
                <div key={block.index} className="relative group">
                  {/* Timeline Node Dot */}
                  <div
                    className={`absolute -left-[27px] top-2 w-3.5 h-3.5 rounded-full border-2 bg-white dark:bg-[#111827] flex items-center justify-center ${
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
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-[#1f2937] bg-slate-50/50 dark:bg-[#0d131f] shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-[#1f2937]">
                      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 font-sans whitespace-nowrap">
                          {getExecutiveEventTitle(block)}
                        </span>
                        <span className="text-[11px] font-sans text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          · {role.label} ({block.worker_id})
                        </span>
                        {statusPill}
                      </div>

                      <div className="flex items-center gap-2 text-slate-400 text-xs font-mono whitespace-nowrap">
                        <span>Block #{block.index}</span>
                        <span>·</span>
                        <span>{new Date(block.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 font-sans mt-2 leading-relaxed">
                      {getExecutiveDescription(block)}
                    </p>

                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-[#1f2937]">
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium font-sans whitespace-nowrap">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Verified Consensus
                      </span>

                      <button
                        onClick={() => {
                          setViewMode('crypto');
                          setExpandedBlockIndex(block.index);
                        }}
                        className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-sans font-medium whitespace-nowrap"
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
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1 font-sans">
            <span>Cryptographic Chaining & Key-Stretched Proofs</span>
            <span>Deterministic SHA-256 Hashes</span>
          </div>

          <div className="space-y-3">
            {blocks.map((block, i) => {
              const isThisBlockTampered =
                isTampered && tamperedIndex !== null && block.index >= tamperedIndex;
              const isDirectlyModified = isTampered && tamperedIndex === block.index;
              const isExpanded = expandedBlockIndex === block.index;

              // At most one status pill:
              let statusBadge = null;
              if (isDirectlyModified) {
                statusBadge = (
                  <span className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 font-medium border border-rose-500/30 whitespace-nowrap">
                    Tamper Injected Here
                  </span>
                );
              } else if (isThisBlockTampered) {
                statusBadge = (
                  <span className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 whitespace-nowrap">
                    Broken Hash Link
                  </span>
                );
              } else if (block.argon2_seal) {
                statusBadge = (
                  <span className="inline-flex items-center gap-1 text-[10px] font-sans font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 whitespace-nowrap">
                    <Lock className="w-2.5 h-2.5" />
                    Argon2id Sealed
                  </span>
                );
              }

              return (
                <div key={block.index} className="relative">
                  {/* Chained Connector Line */}
                  {i > 0 && (
                    <div className="flex items-center justify-center my-1">
                      <div
                        className={`h-4 w-0.5 ${
                          isThisBlockTampered ? 'bg-rose-500' : 'bg-indigo-400/40'
                        }`}
                      />
                      <div className="absolute left-6 text-[10px] font-mono text-slate-400 flex items-center gap-1">
                        <ArrowDown className="w-3 h-3" />
                        <span>sha256(prev_hash)</span>
                      </div>
                    </div>
                  )}

                  {/* Block Card */}
                  <div
                    className={`rounded-xl border transition-all ${
                      isDirectlyModified
                        ? 'bg-rose-50/20 dark:bg-rose-950/20 border-rose-500/60'
                        : isThisBlockTampered
                        ? 'bg-slate-50/50 dark:bg-[#0d131f] border-rose-400/40'
                        : 'bg-slate-50/50 dark:bg-[#0d131f] border-slate-200 dark:border-[#1f2937] hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {/* Block Header */}
                    <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-start sm:items-center gap-3">
                        {/* Block Index Badge */}
                        <div
                          className={`flex flex-col items-center justify-center w-11 h-11 rounded-lg font-mono font-bold border shrink-0 ${
                            isThisBlockTampered
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <span className="text-[9px] text-slate-500 font-normal">BLOCK</span>
                          <span className="text-xs">#{block.index}</span>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">
                              {block.worker_id}
                            </span>
                            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                              · {block.action_type}
                            </span>
                            {statusBadge}
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-300 font-sans mt-1">
                            {block.payload_preview}
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons for this Block */}
                      <div className="flex items-center gap-2 shrink-0 self-end md:self-auto whitespace-nowrap">
                        <button
                          onClick={() => handleTamperClick(block.index)}
                          disabled={loading}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 hover:border-rose-400 text-xs font-sans font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap"
                          title="Simulate malicious tampering of this block's data"
                        >
                          <Bug className="w-3.5 h-3.5 text-rose-500" />
                          <span>Simulate Tamper Attack</span>
                        </button>

                        <button
                          onClick={() => setExpandedBlockIndex(isExpanded ? null : block.index)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs border border-slate-200 dark:border-slate-700 transition-colors"
                          title="Inspect raw cryptographic JSON record"
                        >
                          <FileCode className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Hashes Summary Strip */}
                    <div className="px-4 py-2.5 bg-slate-100/60 dark:bg-slate-900/60 border-t border-slate-200 dark:border-[#1f2937] text-[11px] font-mono flex flex-col md:flex-row md:items-center justify-between gap-2 text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                        <span className="text-slate-400 whitespace-nowrap">BLOCK HASH:</span>
                        <span
                          className={`font-semibold font-mono text-[11px] truncate ${
                            isThisBlockTampered
                              ? 'text-rose-600 dark:text-rose-400 line-through'
                              : 'text-indigo-600 dark:text-indigo-400'
                          }`}
                        >
                          {block.block_hash}
                        </span>
                        <button
                          onClick={() => handleCopyHash(block.block_hash, block.index)}
                          className="hover:text-slate-700 dark:hover:text-slate-200 shrink-0"
                          title="Copy hash"
                        >
                          {copiedHashIndex === block.index ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400">PREV:</span>
                          <span className="text-slate-600 dark:text-slate-400 font-mono">
                            {block.prev_hash.slice(0, 12)}...
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
