# Molfi Design System

> A behavioral contract for UI inheritance across all Molfi interfaces.
> This is not a UI kit — it defines when and how visual elements behave.

---

## 1. Visual Principles

### Color Semantics

| Token | HSL Value | Meaning |
|-------|-----------|---------|
| `--green` | `142 71% 45%` | Positive outcome, YES position, success |
| `--red` | `0 84% 60%` | Negative outcome, NO position, error |
| `--amber` | `38 92% 50%` | Warning, attention, active state, hover |
| `--text` | `0 0% 90%` | Primary readable text |
| `--muted` | `0 0% 40%` | Secondary text, labels |
| `--dim` | `0 0% 15%` | Tertiary text, system labels |
| `--bg` | `0 0% 2%` | Base background |

### Typography Hierarchy

| Level | Font | Size | Tracking | Use Case |
|-------|------|------|----------|----------|
| System | JetBrains Mono | 10-11px | 0.12em | Telemetry, version, status |
| Label | JetBrains Mono | 12-13px | 0.10em | Categories, primitives |
| Body | JetBrains Mono | 14-16px | 0.08em | Domains, assertions |
| Display | JetBrains Mono | 20-48px | 0.18-0.22em | Thesis, headlines |

### Grid System

- Base unit: 48px
- Grid opacity: 6% white
- Used for: Background reference only
- Never visible in operational UI

### Opacity Discipline

| Range | Use Case |
|-------|----------|
| 8-15% | System telemetry, background labels |
| 20-35% | Muted text, primitives |
| 40-60% | Secondary UI elements |
| 70-95% | Primary interactive elements |
| 100% | Active/hovered states only |

---

## 2. Motion Principles

### When Motion Is Allowed

- State transitions (background regime changes)
- User-initiated interactions (hover, click)
- Initial page load (boot sequence)
- Telemetry updates (text changes)

### When Motion Is Forbidden

- Continuous loops that draw attention
- Decorative animations without purpose
- Scale transforms on text
- Bounce or elastic easing
- Any motion lasting > 1 second

### Standard Easing Curves

| Name | Value | Use Case |
|------|-------|----------|
| Protocol | `power4.out` | Boot sequences, major transitions |
| Signal | `power2.out` | Standard UI transitions |
| Snap | `power2.inOut` | Conflict domain, emphasis |
| Smooth | `power4.inOut` | Politics domain, slow transitions |
| Immediate | `power1.out` | Crypto domain, fast response |

### Transition Timing Ranges

| Type | Duration |
|------|----------|
| Micro (hover) | 150-200ms |
| Standard | 300-400ms |
| Emphasis | 400-600ms |
| Major | 600-1000ms |

---

## 3. Interaction Principles

### Hoverable Elements

- Market domains
- CTA links
- Interactive cards
- Buttons

Hover behavior: Color shift to amber, optional letter-spacing expansion

### Inspectable Elements

- Assertions (text scramble on hover)
- Market cards (detail expansion)
- Metrics (tooltip on hover)

### Immutable Elements

- System telemetry (read-only)
- Version labels
- Network status
- Grid background

---

## 4. Mode Distinction

### Narrative Mode (Landing Page)

- Dark, cinematic palette
- Atmospheric backgrounds
- Sparse, positioned text
- Motion as revelation
- Full-screen canvas

### Operational Mode (Trading UI)

- Functional layout
- Dense information display
- Clear action affordances
- Motion only for feedback
- Card-based components

### Analytical Mode (Dashboards)

- Data-first hierarchy
- Muted decorative elements
- Charts use semantic colors
- Minimal animation
- Table/list layouts

### Competitive Mode (Arena)

- Elevated energy
- Amber accent prominence
- Timer/countdown presence
- Leaderboard visibility
- Achievement indicators

---

## 5. Domain-Specific Motion Profiles

Each market domain has unique timing characteristics:

| Domain | BG Duration | Emphasis Duration | Volatility Display |
|--------|-------------|-------------------|-------------------|
| Politics | 800ms | 500ms | LOW |
| Sports | 250ms | 200ms | MEDIUM |
| Conflict | 400ms | 350ms | HIGH |
| Crypto | 200ms | 150ms | HIGH |
| Macro | 1000ms | 600ms | LOW |

---

## 6. Component Behaviors

### Telemetry HUD

- Opacity: 8-18%
- Updates on domain hover
- Shows: REGIME, VOLATILITY, SIGNAL status
- Never dominates attention

### Arena Overlay

- Appears briefly on load (2-3 seconds)
- Shows season/round status
- Fades automatically
- Non-interactive

### Broadcast FX

- Scanlines: 2-4px spacing, 3% opacity
- Grain: SVG noise, 1.5% opacity
- Both use mix-blend-mode: overlay
- Never shimmer or distract

---

## 7. Implementation Notes

### CSS Variables

All colors must be defined in HSL format in `index.css` and referenced through Tailwind tokens.

### GSAP Usage

- Register CustomEase for protocol easing
- Use context for cleanup
- Store running tweens for cancellation
- Never use timeline for simple transitions

### React Patterns

- useCallback for event handlers
- useRef for tween storage
- useMemo for computed values
- State for reactive UI updates

---

*The final result should feel like a protocol that is already running, briefly allowing the user to observe it.*
