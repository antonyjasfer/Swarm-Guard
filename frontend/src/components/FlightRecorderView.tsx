import React, { useState } from 'react';
import { Database, ShieldCheck, ShieldAlert, ArrowDown, Lock, Bug, RotateCcw, CheckCircle, FileText, ChevronRight } from 'lucide-react';
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
  const [expandedBlockIndex, setExpandedBlockIndex] = useState<number | null>(null);

  const isTampered = !verification.valid;
  const tamperedIndex = verification.tampered_block_index;

  return (
    <div className="cyber-card p-5 space-y-5">
      {/* Explorer Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-obsidian-600">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyber-cyan/15 text-cyber-cyan border border-cyber-cyan/30 shadow-glow-cyan">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-mono text-xs font-bold tracking-wider uppercase text-slate-200 flex items-center gap-2">
              Cryptographic Flight Recorder Ledger
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-obsidian-800 text-slate-300 border border-obsidian-700">
                {blocks.length} BLOCKS RECORDED
              </span>
            </h2>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Sub-millisecond SHA-256 Chained Micro-Hashing • Argon2id Key-Stretched Milestone Seals
            </p>
          </div>
        </div>

        {/* Status Verification Badge & Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Integrity Badge */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-xs font-semibold border ${
              isTampered
                ? 'bg-cyber-crimson/15 text-cyber-crimson border-cyber-crimson shadow-glow-crimson animate-pulse'
                : 'bg-cyber-emerald/15 text-cyber-emerald border-cyber-emerald/40 shadow-glow-emerald'
            }`}
          >
            {isTampered ? (
              <>
                <ShieldAlert className="w-4 h-4" />
                <span>CHAIN COMPROMISED // TAMPER AT #{tamperedIndex}</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>CHAIN INTEGRITY VERIFIED (100%)</span>
              </>
            )}
          </div>

          {/* Restore & Re-Verify Button */}
          <button
            onClick={onRestoreAndVerify}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-obsidian-800 hover:bg-obsidian-700 text-slate-200 border border-obsidian-600 text-xs font-mono transition-colors disabled:opacity-50"
            title="Restore original uncompromised chain and verify cryptographic hashes"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Restore & Re-Verify</span>
          </button>
        </div>
      </div>

      {/* Compromised Alert Banner */}
      {isTampered && (
        <div className="p-4 rounded-xl bg-cyber-crimson/10 border-2 border-cyber-crimson shadow-glow-crimson flex items-start gap-3">
          <ShieldAlert className="w-6 h-6 text-cyber-crimson shrink-0 mt-0.5 animate-bounce" />
          <div className="space-y-1">
            <h4 className="font-mono text-xs font-bold text-cyber-crimson uppercase tracking-wider">
              CRYPTOGRAPHIC TAMPER DETECTED BY SWARMGUARD
            </h4>
            <p className="text-xs text-slate-300">
              Payload at <span className="font-mono font-bold text-cyber-crimson">Block #{tamperedIndex}</span> was modified out-of-band!
              Because SHA-256 links each block's prev_hash to its ancestor, all subsequent blocks fail hash validation.
            </p>
          </div>
        </div>
      )}

      {/* Block Chain Visualizer */}
      <div className="space-y-4">
        {blocks.map((block, i) => {
          const isThisBlockTampered = isTampered && tamperedIndex !== null && block.index >= tamperedIndex;
          const isDirectlyModified = isTampered && tamperedIndex === block.index;
          const isExpanded = expandedBlockIndex === block.index;

          return (
            <div key={block.index} className="relative">
              {/* Chain Link Line to previous block */}
              {i > 0 && (
                <div className="flex items-center justify-center my-1">
                  <div
                    className={`h-5 w-0.5 ${
                      isThisBlockTampered ? 'bg-cyber-crimson' : 'bg-cyber-cyan/50'
                    }`}
                  />
                  <div className="absolute left-8 sm:left-12 text-[10px] font-mono text-slate-500 flex items-center gap-1">
                    <ArrowDown className="w-3 h-3" />
                    <span>sha256(prev_hash) link</span>
                  </div>
                </div>
              )}

              {/* Block Card */}
              <div
                className={`rounded-xl border transition-all ${
                  isDirectlyModified
                    ? 'bg-cyber-crimson/15 border-cyber-crimson shadow-glow-crimson'
                    : isThisBlockTampered
                    ? 'bg-obsidian-950 border-cyber-crimson/50'
                    : 'bg-obsidian-950/80 border-obsidian-700 hover:border-cyber-cyan/50'
                }`}
              >
                {/* Block Header */}
                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-3">
                    {/* Index Badge */}
                    <div
                      className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg font-mono font-bold border shrink-0 ${
                        isThisBlockTampered
                          ? 'bg-cyber-crimson/20 text-cyber-crimson border-cyber-crimson/50'
                          : 'bg-obsidian-900 text-cyber-cyan border-cyber-cyan/30'
                      }`}
                    >
                      <span className="text-[10px] text-slate-500 font-normal">BLOCK</span>
                      <span className="text-sm">#{block.index}</span>
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-100">
                          {block.worker_id}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-obsidian-800 text-slate-300 border border-obsidian-700">
                          {block.action_type}
                        </span>
                        {block.argon2_seal && (
                          <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded badge-verified font-semibold">
                            <Lock className="w-3 h-3" />
                            ARGON2ID MILESTONE SEAL
                          </span>
                        )}
                        {isDirectlyModified && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded badge-crimson font-bold">
                            TAMPER INJECTED HERE
                          </span>
                        )}
                        {isThisBlockTampered && !isDirectlyModified && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded badge-crimson">
                            HASH BROKEN
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 font-sans mt-1">
                        {block.payload_preview}
                      </p>
                    </div>
                  </div>

                  {/* Actions for this Block */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onTamperBlock(block.index)}
                      disabled={loading}
                      className="px-2.5 py-1 rounded bg-obsidian-800 hover:bg-cyber-crimson/20 text-slate-300 hover:text-cyber-crimson border border-obsidian-700 hover:border-cyber-crimson/40 text-xs font-mono transition-colors flex items-center gap-1.5"
                      title="Simulate malicious tampering of this block's data"
                    >
                      <Bug className="w-3 h-3 text-cyber-crimson" />
                      <span>Simulate Tamper</span>
                    </button>

                    <button
                      onClick={() => setExpandedBlockIndex(isExpanded ? null : block.index)}
                      className="p-1 rounded bg-obsidian-800 hover:bg-obsidian-700 text-slate-300 text-xs font-mono border border-obsidian-700"
                      title="Inspect Cryptographic Hashes"
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Hashes Summary Strip */}
                <div className="px-4 py-2 bg-obsidian-900/90 border-t border-obsidian-800 text-[11px] font-mono flex flex-col md:flex-row md:items-center justify-between gap-2 text-slate-400">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-slate-500">BLOCK HASH:</span>
                    <span
                      className={`font-semibold truncate ${
                        isThisBlockTampered ? 'text-cyber-crimson line-through' : 'text-cyber-cyan'
                      }`}
                    >
                      {block.block_hash}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-slate-500">PREV HASH:</span>
                    <span className="text-slate-400 truncate">{block.prev_hash.slice(0, 16)}...</span>
                  </div>
                  <div className="text-slate-500 shrink-0">
                    {new Date(block.timestamp).toLocaleTimeString()}
                  </div>
                </div>

                {/* Expanded Raw Inspector */}
                {isExpanded && (
                  <div className="p-4 bg-obsidian-950 border-t border-obsidian-800 font-mono text-xs space-y-2 animate-fade-in">
                    <div className="text-slate-400 text-[11px] font-bold">RAW CRYPTOGRAPHIC LEDGER RECORD:</div>
                    <pre className="p-3 rounded bg-obsidian-900 text-slate-300 text-[11px] overflow-x-auto leading-relaxed border border-obsidian-800">
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
  );
};
