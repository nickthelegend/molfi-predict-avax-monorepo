# System Specification: Rendr (AI Product Demo Maker)

**Status:** ACTIVE DEVELOPMENT (HeyGen Hackathon)

## 1. Vision
Rendr is the premier AI-powered platform for creating high-end product demonstrations. By leveraging **HyperFrames** technology, Rendr eliminates the need for manual video editing. It transforms raw screen recordings into cinematic experiences with automatic zooms, pans, and professional highlights, allowing founders and engineers to "ship their work" with premium visual quality in seconds.

## 2. Core Pillars
- **HyperFrames Engine**: AI-driven video generation that understands UI context and adds cinematic camera movements.
- **Premium Aesthetics**: High-end obsidian/black UI, glassmorphic effects, and fluid animations for both the platform and the output videos.
- **Zero-Editing Workflow**: One-click demo generation—record once, and Rendr handles the rest.
- **Desktop & Web Synergy**: Seamless integration between the Cap desktop recorder and the Rendr web dashboard.

## 3. Technical Constraints
- **Frontend**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4 (Obsidian & JetBrains Mono theme)
- **Database/Persistence**: Supabase (Video storage, user profiles, and session data)
- **AI Video Engine**: HyperFrames (Custom AI pipeline for cinematic rendering)
- **Recording Engine**: Cap (Rust/Tauri foundation for high-performance capture)
- **Animations**: Framer Motion
- **Icons**: Lucide React

## 4. Feature Requirements
### 4.1. The "Studio" Dashboard
- A centralized hub for managing recordings and AI-generated demos.
- High-fidelity preview player for reviewing HyperFrames output.
- Customization controls for brand colors, background blurs, and cursor styles.

### 4.2. HyperFrames AI Pipeline
- **Scene Detection**: Automatically identify UI transitions and key interaction points.
- **Cinematic Pathing**: Generate smooth camera movements (zooms/pans) based on mouse activity and UI changes.
- **Visual Enhancement**: Apply studio-grade filters, noise reduction, and cursor smoothing.

### 4.3. One-Click Sharing
- Instant generation of shareable URLs with viewer analytics.
- Integration with Slack, Discord, and Linear for quick team updates.

### 4.4. Desktop Capture (Cap Integration)
- Native Windows/macOS recorder with low CPU impact.
- Ability to record specific windows, regions, or full screens with high frame rates.

## 5. Security & Privacy
- **Metadata Protection**: Secure handling of UI accessibility/DOM data used for AI training.
- **GDPR/SOC2 Readiness**: Building with data privacy and encryption from day one.
