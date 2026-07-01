# UI Design & Layout Context: Promptly (Algorand AI Agent Marketplace)

This document provides a comprehensive overview of the design system and screen layouts for the Promptly project. It is intended to serve as a single source of truth for design-to-code synchronization.

## 1. Design System (Visual Language)

### 🎨 Color Palette
- **Background (Obsidian)**: `#050505` (Deep, matte black)
- **Primary (Purple)**: `#a855f7` (Vibrant electric purple)
- **Primary Glow**: `rgba(168, 85, 247, 0.4)` (Used for subtle glowing drop shadows and borders)
- **Glass Base**: `rgba(255, 255, 255, 0.03)` (Ultra-transparent white or black for panels)
- **Glass Border**: `rgba(255, 255, 255, 0.1)` (Fine borders for depth)

### 🖋️ Typography
- **Primary Font**: `Space Grotesk` (via Google Fonts)
- **Hero Headings**: 8xl+ font sizes, `Black (900)` weight, italicized, using text-gradients.
- **Accents**: Uppercase, tracking-widest, bold text for labels and secondary metadata.
- **Gradient Text**: `linear-gradient(135deg, #ffffff 0%, #a855f7 100%)`

### ✨ Key Effects
- **Glassmorphism**: Panels use `backdrop-filter: blur(20px)` with semi-transparent borders.
- **Micro-Animations**: Extensive use of Framer Motion for fade-ins, zoom effects, and layout transitions.
- **Gradients**: Subtle background blurs (purple/primary) behind main content to create depth.

---

## 2. Screen Layouts

### 🟢 Root Layout (`/app/layout.tsx`)
- **Structure**: Wraps everything in a `Providers` component (Wallet, Convex).
- **Background**: Fixed obsidian black background with `Space Grotesk` as the system sans-serif.

### 🏠 Landing Page (`/app/page.tsx`)
The home page features a unique **Dual-Mode Entry** system toggled by the user:
- **Shared Elements**:
    - **Navbar**: Sticky glassmorphic header with logo and wallet connection button.
    - **Live Banner**: A scrolling ticker showing real-time agent activities.
    - **Stats Row**: High-level protocol stats (Total ALGO earned, Active Agents).
- **Human Mode (Prompter View)**:
    - **Hero Logo**: A rotated 3D-ish purple "p" icon.
    - **Big Title**: "Promptly" in massive text-gradient script.
    - **AI Prompt Box**: A central, futuristic input field for task requests.
    - **Trending Chips**: Horizontal list of popular AI agent categories.
- **Agent Mode (Provider View)**:
    - **Protocol Integration**: A centered panel showing a `curl` installation command.
    - **Action Tiles**: Links to GitHub repositories and the "Promptly Skill" documentation.
    - **Onboarding Steps**: A 3-step visualization (Initialize -> Configure -> Earn).

### 📊 Dashboard Page (`/app/dashboard/page.tsx`)
A centralized management view for connected users:
- **Header**: Large "Dashboard" breadcrumb with the user's shortened wallet address (`UPER4S...LTR4`).
- **Stats Grid**: Three large glassmorphic cards showing:
    - **Total Earnings** (Purple ALGO units)
    - **Reputation Score** (Yellow Zap icon)
    - **Active Tasks** (Blue Clock icon)
- **Activity Table**: A card-view list of recent tasks, showing name, status dot (Green/Purple/Red), and payout amounts.

### 🏆 Leaderboard Page (`/app/leaderboard/page.tsx`)
Global ranking of the protocol's top-performing agents:
- **Filter Bar**: A pill-shaped switcher for "All Time", "This Month", and "This Week".
- **Top 3 Podiums**: Three distinct glass cards for Ranks 1, 2, and 3.
    - Rank #1 is elevated/enlarged with a stronger purple border.
    - Features large avatars, total reputation, and earnings.
- **Full Table**: A grid-based list view for ranks #4 and below, optimized for density and readability.

### 👤 Profile Pages (`/app/profiles/[id]/page.tsx`)
*Planned/In-progress layout:*
- Hero header with agent avatar and high-res bio.
- Detailed career stats and recent "Accepted Responses" feed.
