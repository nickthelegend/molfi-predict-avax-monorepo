# Design System Specification: Rendr

## 1. Overview & Creative North Star
The Creative North Star for Rendr is **"The Digital Studio."** This system moves away from typical SaaS dashboards toward a high-end, cinematic studio environment. It is designed to feel authoritative, precise, and visually stunning.

We achieve this by embracing **Obsidian Surfaces** and **Technical Typography**. By pairing deep, absolute black backgrounds with JetBrains Mono headlines, the UI feels like a high-end developer tool or a professional video editor. The interface should feel "alive," using subtle glows and glassmorphic blurs to guide the user toward creating premium demos.

---

## 2. Colors & Surface Philosophy
The palette is rooted in a deep, absolute black (`#0a0a0a`), complemented by silver accents and luminous highlights.

### The "Obsidian" Rule
Traditional 1px borders are replaced by tonal shifts. Structural boundaries are defined by shifting from the base `#0a0a0a` to `surface-low` (`#111111`) or `surface-mid` (`#181818`). This creates a seamless, "liquid" feeling where content seems to float in deep space.

### Surface Hierarchy
- **Base Layer:** `#0a0a0a` (The Canvas)
- **Interactive Layers:** `#141414` (Cards/Sections)
- **Elevated Components:** `#1c1c1c` (Modals/Popovers)

### High-Contrast Highlights
For primary actions, use a pure silver or white (`#ffffff`) with high-intensity `backdrop-blur`. This signifies "Studio Precision."

---

## 3. Typography
Typography is our primary tool for communicating technical excellence.

*   **Display (JetBrains Mono):** Use for headlines to give a "Technical/Code" feel. Tighten tracking slightly for a more compact, premium look.
*   **Body (Inter/System):** Use for high-legibility descriptions.
*   **Metadata (JetBrains Mono):** Use All Caps with increased tracking (0.05em) for labels like "RECORDING," "AI RENDERING," or "SHARABLE LINK."

---

## 4. Elevation & Depth
Depth is achieved via **Glassmorphism** and **Soft Glows**.

### Glassmorphic Containers
Use `backdrop-blur-xl` (24px+) with a semi-transparent background (`rgba(20, 20, 20, 0.6)`) and a subtle 1px "inner glow" (white at 5% opacity).

### Dynamic Highlights
When a user hovers over an interactive element, apply a soft, radial glow behind it to simulate a "studio light" turning on.

---

## 5. Components

### Buttons
- **Primary (The "Action" Button):** Pure white background, black text. Roundedness: `lg`. Represents "Export" or "Launch."
- **Secondary:** Transparent background with a subtle silver border.
- **Recording Trigger:** A glowing red indicator when active.

### Studio Cards
Cards represent video clips or demo templates. They should have a large preview area and minimal metadata. On hover, the preview should subtly zoom or "come to life" using CSS transforms.

### The "HyperFrames" Player
A custom video player interface with glassmorphic controls that appear only on hover. It should feel like a professional color-grading or editing suite.

---

## 6. Do's and Don'ts

### Do
- **Do** use JetBrains Mono for all primary headings.
- **Do** lean into absolute blacks. Contrast is your friend.
- **Do** use fluid Framer Motion transitions for every state change.
- **Do** emphasize the video content above all else.

### Don't
- **Don't** use standard "SaaS Blue" or generic brand colors.
- **Don't** use hard, high-contrast borders.
- **Don't** clutter the screen with unnecessary text. Let the demos speak for themselves.
- **Don't** use standard shadows; use tonal layering and glassmorphism.