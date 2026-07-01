# Execution Plan: Rendr (AI Product Demo Maker)

## 1. Project Initialization & Branding
- [x] Pivot from Molfi/Promptly to **Rendr**
- [x] Initialize Next.js 16 (App Router)
- [x] Configure Tailwind CSS v4 with Obsidian/JetBrains Mono theme
- [x] Set up landing page foundation with Framer Motion
- [x] Integrate HyperFrames reference demo (website-to-hyperframes)

## 2. Video Capture Foundation (Cap)
- [x] Integrate Cap monorepo for desktop recording
- [ ] Configure Rust-based capture crates for high-fidelity UI recording
- [ ] Implement UI metadata extraction (DOM/Accessibility trees)
- [ ] Build Tauri-based "Cap Mini" for low-latency recording triggers

## 3. Web Dashboard & Studio
- [x] Hero section and marketing landing page
- [ ] User authentication and profile management (Supabase)
- [ ] "Studio" view for browsing and previewing generated demos
- [ ] Video upload pipeline (streaming from Cap to Supabase)

## 4. HyperFrames AI Integration
- [ ] Connect frontend to HyperFrames rendering API
- [ ] Implement "Key Moment" detection logic (AI analyzing UI metadata)
- [ ] Generate cinematic camera paths (JSON) based on interaction points
- [ ] Build the web-based "Refinement Editor" for adjusting AI zooms/pans

## 5. Sharing & Distribution
- [ ] Public sharing pages with glassmorphic video player
- [ ] One-click export to GIF/MP4
- [ ] Browser extension for instant "Capture this Page" functionality
- [ ] Slack/Discord integration for automated demo sharing

## 6. Hackathon Finalization & Launch
- [ ] Performance optimization for video rendering
- [ ] Polish landing page animations and copy
- [ ] Create the "Launch Video" using Rendr itself
- [ ] Submit to HeyGen Hackathon
