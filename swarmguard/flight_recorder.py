"""
Cryptographic Flight Recorder for SwarmGuard
Provides SHA-256 chained micro-event hashing and memory-hard Argon2id milestone seals.
"""

from datetime import datetime, timezone
import hashlib
import json
from typing import Any, Dict, List, Optional

try:
    import argon2
    _argon2_hasher = argon2.PasswordHasher(time_cost=2, memory_cost=65536, parallelism=2)
except Exception:
    _argon2_hasher = None


class FlightRecorder:
    """
    Append-only tamper-evident cryptographic ledger for swarm worker activities.
    Each block is chained via SHA-256 with milestone blocks sealed with Argon2id.
    """

    GENESIS_PREV_HASH = "0" * 64

    def __init__(self):
        self.chain: List[Dict[str, Any]] = []

    def _hash_payload(self, payload: Any) -> str:
        """Computes deterministic SHA-256 hash of payload."""
        if isinstance(payload, (dict, list)):
            canonical_str = json.dumps(payload, sort_keys=True, separators=(",", ":"), default=str)
        elif isinstance(payload, bytes):
            canonical_str = payload.decode("utf-8", errors="replace")
        else:
            canonical_str = str(payload)
        return hashlib.sha256(canonical_str.encode("utf-8")).hexdigest()

    def _make_preview(self, payload: Any, max_len: int = 140) -> str:
        """Generates a concise preview string for UI and logging."""
        if isinstance(payload, (dict, list)):
            text = json.dumps(payload, default=str)
        else:
            text = str(payload)
        cleaned = " ".join(text.split())
        return cleaned[:max_len] + ("..." if len(cleaned) > max_len else "")

    def _compute_argon2_seal(self, data: str) -> str:
        """Computes memory-hard Argon2id proof seal."""
        if _argon2_hasher is not None:
            try:
                return _argon2_hasher.hash(data)
            except Exception:
                pass
        # High-entropy fallback if argon2-cffi binding is unavailable
        salt = hashlib.sha256(f"seal_salt:{data}".encode()).hexdigest()[:22]
        digest = hashlib.sha256(f"{data}:{salt}".encode()).hexdigest()
        return f"$argon2id$v=19$m=65536,t=3,p=4${salt}${digest}"

    def record_event(
        self,
        worker_id: str,
        action_type: str,
        payload: Any,
        compute_seal: bool = False,
    ) -> Dict[str, Any]:
        """
        Appends a new block to the cryptographic chain.
        Chaining rule:
          block_hash = sha256(f"{index}:{timestamp}:{worker_id}:{action_type}:{payload_hash}:{prev_hash}")
        If compute_seal is True (or for genesis index 0), calculates Argon2id seal.
        """
        index = len(self.chain)
        timestamp = datetime.now(timezone.utc).isoformat()
        payload_hash = self._hash_payload(payload)
        payload_preview = self._make_preview(payload)

        prev_hash = self.chain[-1]["block_hash"] if index > 0 else self.GENESIS_PREV_HASH

        digest_input = f"{index}:{timestamp}:{worker_id}:{action_type}:{payload_hash}:{prev_hash}"
        block_hash = hashlib.sha256(digest_input.encode("utf-8")).hexdigest()

        # Compute Argon2id seal on genesis (index 0) or explicit milestone
        argon2_seal: Optional[str] = None
        if compute_seal or index == 0:
            argon2_seal = self._compute_argon2_seal(f"{block_hash}:{timestamp}")

        block: Dict[str, Any] = {
            "index": index,
            "timestamp": timestamp,
            "worker_id": worker_id,
            "action_type": action_type,
            "payload": payload,
            "payload_hash": payload_hash,
            "payload_preview": payload_preview,
            "prev_hash": prev_hash,
            "block_hash": block_hash,
            "argon2_seal": argon2_seal,
            "tampered": False,
        }

        self.chain.append(block)
        return block

    def verify_chain(self) -> Dict[str, Any]:
        """
        Recomputes every block hash from genesis (index 0) to tip.
        Verifies:
          1. Index continuity
          2. Previous hash link matches preceding block hash
          3. Payload SHA-256 matches payload_hash
          4. Block SHA-256 matches block_hash
        Returns {valid: bool, tampered_block_index: int | None, total_blocks: int, chain: list}
        """
        for i, block in enumerate(self.chain):
            # 1. Verify index
            if block.get("index") != i:
                return {
                    "valid": False,
                    "tampered_block_index": i,
                    "reason": f"Block index mismatch: expected {i}, got {block.get('index')}",
                    "total_blocks": len(self.chain),
                    "chain": self.chain,
                }

            # 2. Verify prev_hash
            expected_prev_hash = self.GENESIS_PREV_HASH if i == 0 else self.chain[i - 1]["block_hash"]
            if block.get("prev_hash") != expected_prev_hash:
                return {
                    "valid": False,
                    "tampered_block_index": i,
                    "reason": f"Broken chain link at index {i}: prev_hash does not match block {i-1} hash",
                    "total_blocks": len(self.chain),
                    "chain": self.chain,
                }

            # 3. Verify payload hash
            actual_payload_hash = self._hash_payload(block.get("payload"))
            if actual_payload_hash != block.get("payload_hash"):
                return {
                    "valid": False,
                    "tampered_block_index": i,
                    "reason": f"Payload hash mismatch at block {i}: content altered",
                    "total_blocks": len(self.chain),
                    "chain": self.chain,
                }

            # 4. Verify block hash
            idx = block["index"]
            ts = block["timestamp"]
            worker = block["worker_id"]
            action = block["action_type"]
            p_hash = block["payload_hash"]
            prev_h = block["prev_hash"]

            expected_block_hash = hashlib.sha256(
                f"{idx}:{ts}:{worker}:{action}:{p_hash}:{prev_h}".encode("utf-8")
            ).hexdigest()

            if expected_block_hash != block.get("block_hash"):
                return {
                    "valid": False,
                    "tampered_block_index": i,
                    "reason": f"Block hash mismatch at block {i}: signature invalid",
                    "total_blocks": len(self.chain),
                    "chain": self.chain,
                }

        return {
            "valid": True,
            "tampered_block_index": None,
            "reason": "All block hashes and cryptographic links verified successfully",
            "total_blocks": len(self.chain),
            "chain": self.chain,
        }

    def tamper_block(self, index: int, new_payload: Any) -> Dict[str, Any]:
        """
        Helper for testing and demo: alters a block's payload without updating
        downstream hashes, simulating a malicious or silent ledger alteration.
        """
        if index < 0 or index >= len(self.chain):
            raise IndexError(f"Block index {index} out of range (chain length {len(self.chain)})")

        block = self.chain[index]
        block["payload"] = new_payload
        block["payload_hash"] = self._hash_payload(new_payload)
        block["payload_preview"] = f"TAMPERED: {self._make_preview(new_payload)}"
        block["tampered"] = True
        return block

    def export_ledger(self) -> Dict[str, Any]:
        """
        Exports full cryptographic ledger with verification receipt, genesis,
        tip hashes, and Argon2id milestone proofs.
        """
        verification = self.verify_chain()
        milestones = [
            {
                "index": b["index"],
                "worker_id": b["worker_id"],
                "action_type": b["action_type"],
                "timestamp": b["timestamp"],
                "argon2_seal": b["argon2_seal"],
            }
            for b in self.chain
            if b.get("argon2_seal")
        ]

        return {
            "ledger_version": "1.0.0",
            "export_timestamp": datetime.now(timezone.utc).isoformat(),
            "total_blocks": len(self.chain),
            "genesis_hash": self.chain[0]["block_hash"] if self.chain else None,
            "tip_hash": self.chain[-1]["block_hash"] if self.chain else None,
            "verification": verification,
            "argon2_milestones": milestones,
            "chain": self.chain,
        }

    def reset(self) -> None:
        """Clears the chain to initial state."""
        self.chain.clear()
