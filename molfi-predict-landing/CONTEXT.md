# Context Checkpoint: Rendr (AI Product Demo Maker)

**Current Status:** Phase 1 (Foundation & UI) complete.
**Current Date:** 2026-05-01

## 1. Summary of Accomplishments
- **Rebranding**: Successfully pivoted from Molfi/Promptly to **Rendr**, focusing on AI-powered product demonstrations.
- **Frontend Infrastructure**: Set up Next.js 16 with the App Router and Tailwind CSS v4.
- **HyperFrames Demo**: Integrated the `website-to-hyperframes-demo` as a reference for cinematic AI video generation.
- **UI Aesthetics**: Built a high-end obsidian/black landing page with glassmorphic elements, tailored for a premium "Studio" feel.
- **Project Structure**: Organized the monorepo to include `Cap` (the recording engine) and `rendr-landing-page`.

## 2. Technical Context for Next Developer
- **Environment**: Next.js 16, Tailwind v4. The project focuses on high-performance video rendering and UI capture.
- **Core Engine**: **HyperFrames** is the AI backbone, responsible for understanding DOM/UI structure and generating camera movements.
- **Recording foundation**: Built on top of **Cap**, the open-source Loom alternative. Use the `Cap` directory for any low-level capture or Rust-based media processing.
- **Design Tokens**: The design uses a "Digital Architect" aesthetic—obsidian backgrounds, JetBrains Mono typography, and high-contrast highlights.

## 3. Next Immediate Goals (High Priority)
1. **Waitlist/Onboarding**: Implement the lead capture form on the landing page.
2. **HyperFrames Integration**: Connect the landing page "demo" section to the actual HyperFrames rendering logic.
3. **Desktop App Sync**: Ensure the `Cap` desktop app can communicate with the Rendr web dashboard for instant uploads.
4. **Extension Hook**: Scaffold the browser extension that triggers Rendr capture directly from a webpage.

## 4. Potential Pitfalls/Gotchas
- **Video Rendering Latency**: AI video generation (HyperFrames) is computationally expensive; ensure proper loading states and async handling.
- **Cross-Platform Capture**: Screen recording permissions on Windows (current OS) require specific handling in the `Cap` Rust crates.
- **Tailwind v4 Migration**: Ensure all components are using the new CSS-first configuration patterns in Tailwind v4.
