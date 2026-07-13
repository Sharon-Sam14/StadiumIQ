# Design System & UI Specifications
## StadiumIQ — GenAI-Powered FIFA World Cup 2026 Operations Platform

This document defines the StadiumIQ design system. It establishes visual styles, interaction states, accessibility standards, and responsive tokens to ensure that the three primary user interfaces (Command Center Web, Fan Mobile App, and Volunteer Portal PWA) deliver a unified, premium, and state-of-the-art visual experience.

---

## Table of Contents
1. [Design Philosophy](#1-design-philosophy)
2. [Color Palette](#2-color-palette)
3. [Typography](#3-typography)
4. [Spacing & Grid](#4-spacing--grid)
5. [Borders & Shadows](#5-borders--shadows)
6. [Component Specifications](#6-component-specifications)
   - [Buttons](#buttons)
   - [Inputs & Form Controls](#inputs--form-controls)
   - [Cards & Containers](#cards--containers)
   - [Tables](#tables)
   - [Charts & Heatmaps](#charts--heatmaps)
7. [Iconography](#7-iconography)
8. [Motion & Animations](#8-motion--animations)
9. [Responsive Breakpoints](#9-responsive-breakpoints)
10. [Dark Mode & Theme Adaptation](#10-dark-mode--theme-adaptation)
11. [Accessibility (A11y) Standards](#11-accessibility-a11y-standards)
12. [UI Inspiration & Reference Guidelines](#12-ui-inspiration--reference-guidelines)

---

## 1. Design Philosophy

StadiumIQ's interface design centers on **high cognitive clarity, atmospheric luxury, and dynamic responsiveness**. Managing massive live events requires reducing cognitive load. The design operates on three pillars:

- **Sleek Data Density:** Present complex operational information (crowd counts, incident states, queues) via highly readable graphs and heatmaps without visual clutter.
- **Glassmorphic Depth:** Use overlapping layers, realistic drop shadows, and subtle blur effects to establish a clear spatial hierarchy, simulating physical glass panes floating over dynamic maps.
- **Micro-Feedback Physics:** Interactive elements should react immediately to user input with smooth, spring-like easing functions that mirror physical touch, generating a satisfying and reliable feel.

---

## 2. Color Palette

The color strategy features a dark-mode-first base accented by celebratory, high-visibility tournament colors. Brand tones must maintain a minimum contrast ratio of `4.5:1` against their respective backgrounds.

### 2.1 CSS Custom Properties (Variables)
```css
:root {
  /* Brand Palette */
  --brand-green-deep: #0C3A2B;  /* FIFA Emerald */
  --brand-green-light: #1E6B52;
  --brand-gold: #D4AF37;        /* FIFA Gold */
  --brand-gold-glow: #F3E5AB;

  /* Neutrals (Dark Theme Baseline) */
  --bg-base: #080A0C;           /* Void Black */
  --bg-surface: #101418;        /* Obsidian Dark */
  --bg-surface-elevated: #181E24;
  --border-subtle: #242D36;
  --border-strong: #323E4B;

  /* Typography Colors */
  --text-primary: #F0F4F8;      /* Warm white */
  --text-secondary: #9AA8B6;    /* Muted slate */
  --text-tertiary: #627282;     /* Dark gray/disabled */

  /* Semantic Alerts */
  --color-success: #10B981;     /* Emerald Green */
  --color-warning: #F59E0B;     /* Amber Orange */
  --color-danger: #EF4444;      /* Crimson Red */
  --color-info: #3B82F6;        /* Royal Blue */
}
```

### 2.2 Semantic Usage Spectrum
- **Primary Action Accent:** `--brand-gold` for primary call-to-actions, core highlights, and navigation nodes.
- **Operational Health Indicators:**
  - **Green (Normal):** `--color-success` (crowd capacity <60%, operational gate, normal transit flow).
  - **Yellow (Advisory):** `--color-warning` (crowd capacity 60-79%, warning thresholds).
  - **Red (Critical Incident):** `--color-danger` (crowd capacity >=90%, closed gate, active security/medical incident).

---

## 3. Typography

StadiumIQ relies on two primary typefaces imported from Google Fonts to balance clean operational utility with high-end editorial flair:
1. **Outfit** (Geometric Sans-Serif) – Used for primary headings, metric indicators, and navigation labels.
2. **Inter** (Highly Legible Neo-Grotesque Sans-Serif) – Used for body copy, form fields, tabular data, and AI transcripts.

### 3.1 Typographic Scale

| Style Name | Typeface | Weight | Size | Line Height | Letter Spacing |
|------------|----------|--------|------|-------------|----------------|
| **Display Heading** | Outfit | 800 (Extra Bold) | 40px (2.5rem) | 48px (1.2) | -0.02em |
| **H1 Title** | Outfit | 700 (Bold) | 32px (2.0rem) | 38px (1.2) | -0.015em |
| **H2 Section** | Outfit | 600 (Semi-Bold) | 24px (1.5rem) | 30px (1.25) | -0.01em |
| **H3 Sub-section** | Outfit | 600 (Semi-Bold) | 20px (1.25rem) | 26px (1.3) | 0.0em |
| **Body Large** | Inter | 400 (Regular) | 16px (1.0rem) | 24px (1.5) | 0.0em |
| **Body Medium / Default** | Inter | 400 (Regular) | 14px (0.875rem) | 20px (1.45) | 0.005em |
| **Label / Caption** | Inter | 500 (Medium) | 12px (0.75rem) | 16px (1.33) | 0.02em |
| **Monospace / Code** | Fira Code | 400 (Regular) | 12px (0.75rem) | 16px (1.33) | 0.0em |

---

## 4. Spacing & Grid

We implement an **8px hard-grid system** for layout structural consistency. All margins, padding, and layout wrappers must use multiples of 8px.

### 4.1 Spacing Tokens
- `$space-xxs`: `4px`
- `$space-xs`: `8px`
- `$space-sm`: `16px`
- `$space-md`: `24px`
- `$space-lg`: `32px`
- `$space-xl`: `48px`
- `$space-xxl`: `64px`

### 4.2 Grid Layout Systems
- **Command Center Web:** 12-column dynamic flex-grid. Left-hand side operational navigation is locked at `280px`. Central dynamic workspaces adjust responsively using grid column spans.
- **Fan Mobile App:** Single-column layout with fixed padding of `$space-sm` (`16px`) on lateral edges. Bottom action drawers slide upward dynamically.

---

## 5. Borders & Shadows

To reinforce visual hierarchy and realistic spatial depth, we use glassmorphism borders and layered shadows.

### 5.1 Border Radius Tokens
- `$radius-sm`: `4px` (Tags, small checkboxes, badges)
- `$radius-md`: `8px` (Buttons, small inputs, control panels)
- `$radius-lg`: `16px` (Cards, map panels, modular sections)
- `$radius-xl`: `24px` (Dialog windows, sliding bottom drawers, major widgets)
- `$radius-full`: `9999px` (Avatars, pills, notification counters)

### 5.2 Shadow Elevations (Glassmorphism & Depth)
- **Elevation Flat / Inset:** `box-shadow: inset 0 1px 1px 0 rgba(255, 255, 255, 0.05);` (Subtle internal bevel)
- **Elevation Low (Cards):** `box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2);`
- **Elevation High (Overlays, Modals):** `box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 10px 10px -5px rgba(0, 0, 0, 0.4);`
- **Glass Panel Background:** `background: rgba(16, 20, 24, 0.75); backdrop-filter: blur(12px); border: 1px solid var(--border-subtle);`

---

## 6. Component Specifications

### Buttons

Buttons support 4 visual variants: Primary, Secondary, Outline, and Ghost.

```
[ Primary Action ]    [ Secondary Action ]    [ Outline Action ]    [ Ghost ]
```

#### State Definitions:
- **Primary:** Background: `--brand-gold`, Text: `--bg-base`.
  - *Hover:* Background: `#E5BE3F` with scale effect (`scale(1.02)`).
  - *Active:* Background: `--brand-gold` with scale down (`scale(0.98)`).
  - *Disabled:* Background: `--border-subtle`, Text: `--text-tertiary`, cursor not-allowed.
- **Secondary:** Background: `--bg-surface-elevated`, Text: `--text-primary`, Border: `1px solid var(--border-subtle)`.
  - *Hover:* Background: `#202830`, Border: `1px solid var(--border-strong)`.
- **Outline:** Background: `transparent`, Text: `--text-primary`, Border: `1px solid var(--border-strong)`.
- **Ghost:** Background: `transparent`, Text: `--text-secondary`.
  - *Hover:* Background: `rgba(255, 255, 255, 0.03)`, Text: `--text-primary`.

#### Interactive Focus State:
Every interactive component must show an outline on focus:
`outline: 2px solid var(--brand-gold); outline-offset: 2px;`

---

### Inputs & Form Controls

Form inputs must clearly communicate their focus and verification state.

```
┌──────────────────────────────────────────────┐
│  Search concessions...                     🔍 │ (Default)
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│  Input text...                               │ (Focus - Gold border)
└──────────────────────────────────────────────┘
```

#### Styling Specifications:
- **Default Base:** Background: `--bg-base`, Border: `1px solid var(--border-subtle)`, Color: `--text-primary`, Height: `44px`, Padding: `0 $space-sm`.
- **Focus State:** Border: `1px solid var(--brand-gold)`, `box-shadow: 0 0 0 4px rgba(212, 175, 55, 0.15)`.
- **Error State:** Border: `1px solid var(--color-danger)`, Text: `--text-primary`. A helpful error caption is displayed beneath the field using `--color-danger`.
- **Disabled State:** Background: `--bg-surface-elevated`, Opacity: `0.6`, cursor not-allowed.

---

### Cards & Containers

Cards are the structural foundation for dashboards and in-app widgets.

```
┌──────────────────────────────────────────────┐
│ Card Header                                 │
├──────────────────────────────────────────────┤
│ Card body content here...                    │
│                                              │
└──────────────────────────────────────────────┘
```

#### Structure & Theme:
- Background: `rgba(24, 30, 36, 0.7)`, border: `1px solid var(--border-subtle)`, backdrop-filter: `blur(8px)`.
- Card padding defaults to `$space-md` (`24px`).
- Hover Interaction: Card lifts up using `transform: translateY(-2px);` and border turns to `--border-strong` with a transition duration of `0.2s`.

---

### Tables

Table structures display schedules, incident queues, and volunteer metrics.

| ID | Title | Priority | Status | Assigned | Time |
|---|---|---|---|---|---|
| INC-12 | Crowd surge at Gate A | High | Active | A. Diallo | 19:30 |
| INC-13 | Elevator 4 Malfunction | Medium | Pending | J. Whitmore | 19:28 |

#### Tabular Details:
- **Headers:** Background: `--bg-surface`, Text-transform: `uppercase`, Font-size: `11px`, Tracking: `0.05em`, Color: `--text-secondary`, Border-bottom: `2px solid var(--border-strong)`.
- **Rows:** Background: `transparent`, Transition: `background 0.15s ease`.
  - *Hover State:* Row background shifts to `rgba(255,255,255,0.02)`.
  - *Alt Striping:* No full striping; row borders are separated by a 1px border-bottom (`--border-subtle`).

---

### Charts & Heatmaps

Charts must look sleek, clean, and fit the dark theme.

- **Line / Area Charts:** Use thin stroke widths (`2px`). Highlight curves using subtle gradients underneath matching the accent color.
- **Crowd Density Heatmaps:** Custom canvas grids displaying color interpolations from green (`#10B981` at 0-50% occupancy) to yellow (`#F59E0B` at 50-80%) and red (`#EF4444` at >80%).
- **Chart Palette:**
  - Data Stream 1: `--brand-gold`
  - Data Stream 2: `--brand-green-light`
  - Secondary Data Stream: `--color-info`

---

## 7. Iconography

We use **Lucide Icons** for all web applications, PWA, and dashboard interfaces.
- **Default Sizing:**
  - Standard action buttons / menu links: `20px` x `20px`.
  - Large navigation widgets / stats blocks: `24px` x `24px`.
  - Tiny info tips / text tags: `14px` x `14px`.
- **Style Constraints:** Thin stroke widths (`1.5px` or `2.0px`) with rounded joins. Never mix solid/filled icons with outline-only models on the same page.

---

## 8. Motion & Animations

All transitions must feel natural and lightweight. Never use linear animations for structural page movements.

### 8.1 Easing & Timing Curves
- **Standard Ease-Out (UI Transitions):** `cubic-bezier(0.16, 1, 0.3, 1)` (Ultra-smooth deceleration)
- **Elastic Bounce (Modals, Dialogs):** `cubic-bezier(0.34, 1.56, 0.64, 1)` (Subtle bounce)
- **Transition Duration Scales:**
  - Immediate feedback (Checkbox toggle, button active states): `100ms`.
  - Hover states and drawer sliding: `250ms`.
  - Heavy transitions (Page load shifts, modal entrance): `400ms`.

### 8.2 Common Micro-Animations
- **Hover Lift:** `transform: translateY(-2px); transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);`
- **Fade Entrance:** Page wrappers load at `opacity: 0; transform: translateY(4px);` fading in to `opacity: 1; transform: translateY(0);`.

---

## 9. Responsive Breakpoints

StadiumIQ scales responsively across layout boundaries.

- **Mobile Portrait (xs):** `< 480px` (Fan mobile layouts and volunteer lists).
- **Mobile Landscape / Small Tablet (sm):** `480px - 768px`.
- **Large Tablet (md):** `769px - 1024px` (Command center dashboard fallback grid).
- **Desktop Dashboard (lg):** `1025px - 1440px` (Command center standard 12-column grid).
- **Ultra-Wide Screens (xl):** `> 1440px` (Command Center large operation walls).

---

## 10. Dark Mode & Theme Adaptation

StadiumIQ is **dark-mode-first** due to outdoor stadium environments, reducing screen glare for operators at night and preserving mobile battery life for fans and volunteers during long tournament days.

- **System Preference Detection:** Implement automatic media checks:
  ```javascript
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  ```
- **Light Theme Support (High Contrast fallback):** If a user explicitly triggers light mode, CSS variables are re-mapped. Background surfaces change to light warm neutrals (`#F4F6F8`), text changes to dark charcoal (`#1A202C`), and borders adapt to `#D1D5DB`. We ensure all text elements maintain a minimum contrast ratio of `4.5:1` in both views.

---

## 11. Accessibility (A11y) Standards

We design StadiumIQ to meet **WCAG 2.2 AA** (and target WCAG 2.2 AAA for high-priority operational sections).

- **Keyboard Traps:** Modals and bottom sliding drawers must catch focus on launch, cycling options using Tab, and closing on Esc key press.
- **Focus Rings:** Visible focus rings must never be hidden (`outline: 2px solid var(--brand-gold)`).
- **Screen Readers:** All decorative SVGs must have `aria-hidden="true"`. All interactive widgets must specify meaningful labels using `aria-label` or `aria-labelledby`.
- **Contrast Checkers:** Maintain automated lint testing to guarantee contrast thresholds:
  - Normal text: `>= 4.5:1`.
  - Large text (heading >= 24px): `>= 3.0:1`.
  - Graphical components (charts, heatmaps): `>= 3.0:1`.

---

## 12. UI Inspiration & Reference Guidelines

We pull visual design patterns from industry leaders:

- **Vercel:** Elegant minimalist typography spacing and stark, border-demarcated grids.
- **Linear:** High-depth glassmorphic overlays, subtle accent glows, and lightning-fast keyboard navigation controls.
- **Stripe:** Extremely crisp chart aesthetics, smooth drop shadows, and intuitive layout transitions.
- **Apple:** Accessible, high-contrast text sizing, large touch targets, and tactile haptic animation cues.
- **Notion:** Minimalist layout hierarchies that keep data structured and readable during complex task tracking.
