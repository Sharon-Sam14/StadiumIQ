# Visual Design System Tokens — StadiumIQ

This document details the visual style system and UI guidelines for the StadiumIQ application.

---

## 1. Color Palette (Dark Theme Glassmorphism)

The interface uses a curated dark mode palette with gold and green accents:
* **Backgrounds**: Dark Slate (`#0B0F19` to `#1E293B`)
* **Accents**: 
  - FIFA Brand Gold (`#D4AF37` / `#F59E0B`)
  - Eco Green (`#10B981` / `#059669`)
* **Text**:
  - Primary: White (`#FFFFFF`)
  - Secondary: Slate Grey (`#94A3B8`)
  - Tertiary: Dark Grey (`#475569`)

---

## 2. Spacing & Typography

* **Fonts**: Default browser sans-serif stack mapped via Tailwind config settings.
* **Border Radius**: Responsive rounded corners (`rounded-2xl` / `rounded-xl`) mapped to cards and dialog container panels.
* **Glassmorphic Attributes**:
  - `backdrop-blur-md`
  - `bg-slate-900/80`
  - Borders: `border-slate-800`

---

## 3. UI Guidelines

### Buttons
Primary call-to-actions are styled with a gradient gold fill, while secondary buttons utilize a subtle slate border. Keyboard focus is highlighted using gold focus outline boundaries.

### Interactive Components
All forms, switches, and sliders contain clear ARIA descriptors and semantic HTML element bounds to satisfy accessibility targets.
