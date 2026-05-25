---
name: FokusMode
description: A high-performance productivity instrument for deep work.
colors:
  primary: "#18181b"
  primary-foreground: "#fafafa"
  background: "#09090b"
  foreground: "#fafafa"
  accent: "#8b5cf6"
  muted: "#27272a"
  border: "#27272a"
typography:
  display:
    fontFamily: "Inter, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "6px"
  md: "10px"
  lg: "12px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary-foreground}"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: "10px 24px"
  card-glass:
    backgroundColor: "rgba(9, 9, 11, 0.5)"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
---

# Design System: FokusMode

## 1. Overview

**Creative North Star: "The Deep Sea Instrument / Midnight Engine"**

FokusMode is engineered as a high-performance productivity instrument. It rejects the static, bright environments of traditional software in favor of an immersive "Midnight Engine"—a rhythmic, fluid space where design recedes to let the user's work take center stage.

The system uses a **Deep Space & Neon** palette to evoke the feel of a precision tool operating in a low-light environment. Depth is conveyed through tonal shifts and blur rather than shadows, creating a "liquid" UI that feels alive and responsive.

**Key Characteristics:**
- Atmospheric immersiveness through glassmorphism.
- Rhythmic, fluid motion (250ms+ eases).
- High-density information with clear primary actions.

## 2. Colors

The palette is rooted in the **Obsidian Void**, with sharp **Neon Pulse** accents for focus states.

### Primary
- **Deep Space Neon** (#18181b): The core surface color for containers and sidebars.
- **Neon Pulse** (#8b5cf6): Used exclusively for active focus states, timers, and primary success indicators.

### Neutral
- **Obsidian Void** (#09090b): The primary background color. Everything emerges from this void.
- **Ghost Border** (#27272a): Used for subtle structural division.

### Named Rules
**The Rarity Rule.** The Neon Pulse accent must be used on ≤5% of any given screen. Its rarity creates the "signal" in the void.

## 3. Typography

**Display & Body Font:** Inter (Variable)

Inter provides the technical precision required for a high-performance tool while remaining readable at high densities.

### Hierarchy
- **Display** (700, 2.25rem, 1.2): Used for the main timer and page headers.
- **Title** (600, 1.125rem, 1.4): Used for card headings and section titles.
- **Body** (400, 0.875rem, 1.5): The standard interface font for data and labels.
- **Label** (500, 0.75rem, 0.05em letter-spacing): Used for micro-copy and metadata.

## 4. Elevation

**The Tonal Drift Rule.** Depth is created by color shifts and `backdrop-filter: blur(12px)`. Surfaces do not "float" with shadows; they "emerge" from the background through transparency and blur.

### Shadow Vocabulary
- **Neon Glow** (`0 0 20px rgba(139, 92, 246, 0.15)`): Used only for the active timer or primary focus elements.

## 5. Components

### Buttons
- **Shape:** Rounded Medium (10px)
- **Primary:** High-contrast (Primary-Foreground on Primary) with fluid 250ms transitions.
- **Neon-Glow:** Buttons used for "Start Focus" feature a subtle `pulse-glow` animation.

### Cards / Containers
- **Style:** Glass (60% background opacity + 12px blur).
- **Border:** Ghost Border (1px solid rgba(255, 255, 255, 0.05)).

### Navigation
- **Sidebar:** Obsidian Void background with subtle active-state indents and Neon Pulse indicators.

## 6. Do's and Don'ts

### Do:
- **Do** use `.glass` utilities for all secondary panels.
- **Do** use `pulse-glow` for the active focus state.
- **Do** maintain a high contrast ratio for primary timers.

### Don't:
- **Don't** use heavy black shadows; they break the "Deep Sea" immersion.
- **Don't** use "SaaS-cream" or blue-tinted neutrals.
- **Don't** use em-dashes or cluttered labels.
- **Don't** use abrupt transitions; always favor fluid eases.
