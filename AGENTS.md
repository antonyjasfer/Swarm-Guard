# Linear x Stripe Enterprise Design System Rules

All frontend UI components, styling, typography, and copy across the workspace MUST strictly comply with these enterprise design standards:

### 1. Typography & Hierarchy
- **UI Copy & Body Text**: Use `font-sans` (`Inter`, system-ui). All headers, button labels, descriptions, navigation, and modal text must use Inter with clean letter-spacing and weight hierarchy (semibold for headers, medium for buttons, regular for body).
- **Code, Hashes & Telemetry**: Use `font-mono` (`JetBrains Mono`, `ui-monospace`). Strictly reserve monospace for cryptographic hashes (SHA-256, Argon2id), block indices, API endpoint paths (`/api/v1/...`), payload diffs, and timestamps. Never use monospace for general conversational UI copy.

### 2. Executive Plain-English Copy (Zero Cryptic Jargon)
- Replace sci-fi / cyberpunk jargon with clear, professional enterprise terminology:
  - ❌ Avoid: "CYBER SENTINEL", "INTERCEPTOR MESH", "TAMPER BREACH DETECTED", "TERMINAL PURGE"
  - ✅ Use: "Active Contract Verifier", "Policy Approval Gate", "Contract Drift Intercepted", "Cryptographic Audit Ledger", "Run Integrity Check"
- Status badges must be human-readable and executive-friendly:
  - `Verified / Clean`, `Drift Intercepted`, `Awaiting Review`, `Override Approved`.

### 3. Guided 1-2-3 Onboarding
- Critical multi-step workflows (such as demo execution, contract locking, or policy overrides) must feature clear, numbered 1-2-3 progressive indicator steps so new users and hackathon judges instantly understand the operational sequence.

### 4. Glassmorphic Surface Styling
- Surfaces must use clean, subtle glassmorphism:
  - `backdrop-blur-xl` or `backdrop-blur-md`
  - Subtle 1px borders: `border-slate-800/80` or `border-zinc-800/60` (Dark) / `border-slate-200/80` (Light)
  - Card backgrounds: `bg-slate-900/75` (Dark) / `bg-white/80` (Light)
  - Avoid loud, oversaturated neon glows; use refined accent highlights (subtle cyan/indigo glow on active states).

### 5. Motion & Transitions (Framer Motion)
- Use Framer Motion (`motion/react` or `framer-motion`) for layout animations, expanding drawers, modal entries, and tab transitions.
- Transitions must feel crisp and responsive: `duration: 0.2` to `0.3`, ease `[0.16, 1, 0.3, 1]`.

### 6. Interactive Toast Notifications (Sonner)
- All user-triggered actions (exporting ledger, locking contracts, approving overrides, simulating drift) must trigger immediate, informative Sonner toast notifications:
  - `toast.success("Audit ledger exported successfully")`
  - `toast.warning("Contract drift detected on /api/v1/checkout")`
  - `toast.error("Integrity check failed: Block #N tampered")`

### 7. Clean Light / Dark Theme Architecture
- Components must properly support both Dark mode (default) and Light mode via Tailwind CSS class strategy (`dark:` classes and CSS variables).
- Provide a clean theme toggle in the application navigation header.
