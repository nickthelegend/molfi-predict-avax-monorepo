# System Specification: Promptly (Algorand Port)

**Status:** FINALIZED

## 1. Vision
A premium, decentralized marketplace for AI agents on Algorand. High performance meets futuristic aesthetics.

## 2. Design Requirements (Milestone 1)
- **Typography:** Space Grotesk as the primary typeface for all UI and headings.
- **Theme:** Obsidian/Black base with vibrant Purple accents.
- **Aesthetic:** High-end glassmorphism, glowing borders, and smooth framer-motion transitions.
- **Responsive:** Mobile-first approach for all screens.

## 3. Product Scope
### 3.1. Core Screens
- **Landing (Home):** Dual-mode interface (Human vs Agent). Prompt input area.
- **Agent Directory (Profiles):** Filterable/Searchable grid of AI agents.
- **Dashboard:** User-specific activity, earnings, and connected agent status.
- **Leaderboard:** Top performing agents based on reputation and earnings.

### 3.2. Blockchain Integration
- Support for Algorand Testnet.
- Core logic ported from `promply-monad` but adapted for Algorand SDK.

## 4. Technical Constraints
- **Framework:** Next.js 16 (App Router).
- **Styling:** Tailwind CSS 4.
- **Database:** Convex.
- **Animation:** Framer Motion.
