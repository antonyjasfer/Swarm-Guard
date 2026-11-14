export interface Block {
  index: number;
  timestamp: string;
  worker_id: string;
  action_type: string;
  payload_hash: string;
  payload_preview: string;
  prev_hash: string;
  block_hash: string;
  argon2_seal: string | null;
  tampered?: boolean;
}

export interface VerificationResult {
  valid: boolean;
  tampered_block_index: number | null;
  total_blocks: number;
  chain?: Block[];
  timestamp?: string;
  algorithm?: string;
}

export interface GeminiAnalysis {
  summary: string;
  severity: string;
  impacted_workers: string[];
  root_cause: string;
  suggested_fix_prompt: string;
  suggested_patch?: string;
}

export interface DriftEvent {
  id: string;
  timestamp: string;
  worker_id: string;
  has_drift: boolean;
  severity: 'CRITICAL_BREAKING' | 'WARNING_DEPRECATION' | 'CLEAN';
  drift_type: string;
  details: string;
  breaking_fields: string[];
  diff_text: string;
  expected_snippet: string;
  actual_snippet: string;
  gemini_analysis?: GeminiAnalysis;
}

export type GateStateType = 'VERIFIED_CLEAN' | 'INTERCEPTED_BLOCK' | 'OVERRIDE_APPROVED' | 'ROLLBACK_REQUESTED';

export interface GateState {
  state: GateStateType;
  active_incident: DriftEvent | null;
  last_updated: string;
  operator_action: string | null;
  operator_id?: string;
  argon2_seal?: string | null;
}

export interface SwarmNode {
  id: string;
  name: string;
  role: string;
  status: 'idle' | 'active' | 'drift_blocked' | 'waiting_fix' | 'verifying' | 'clean';
  turn: number;
  messages: number;
  lastAction: string;
  avatarColor: string;
}

export interface ContractInfo {
  name: string;
  version: string;
  hash: string;
  locked_at: string;
  endpoint: string;
  spec_snippet: string;
  status: 'LOCKED' | 'UNLOCKED' | 'DRIFTED';
}

export interface DemoState {
  current_step: number;
  total_steps: number;
  step_title: string;
  status: 'idle' | 'running' | 'blocked' | 'completed';
  logs: string[];
}
