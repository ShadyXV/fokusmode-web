# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->

## Commands

```bash
# Development (run both concurrently)
npx convex dev        # Start Convex backend (separate terminal)
npm run dev           # Start Vite dev server at http://localhost:5173

# Build & lint
npm run build         # tsc -b && vite build
npm run lint          # eslint .
npm run preview       # Preview production build
```

No test suite is configured in this project.

## Architecture

FokusMode is a Pomodoro/focus session tracker. The app has no auth — it is single-user by design.

### Provider hierarchy (`src/main.tsx`)

```
ConvexProvider → TooltipProvider → BrowserRouter → TimerProvider → App
```

`TimerProvider` (`src/context/TimerContext.tsx`) is the core stateful layer. It owns:
- Active timer state (via `useTimer` hook)
- Session mode: `"focus" | "break"`
- Selected tag ID
- Persistence of in-progress sessions to `localStorage` (keys prefixed `fokus_session_*`) so sessions survive page refreshes
- Saving completed/interrupted sessions to Convex on timer end

### Timer engine (`src/hooks/useTimer.ts`)

A tick-based timer using `setInterval` at 100ms. Time is computed from a wall-clock `startTimeRef` (`Date.now()`) rather than accumulated ticks, so browser throttling in background tabs doesn't cause drift. The `start(duration, resumeStartTime?)` signature enables session restoration from `localStorage`.

### Convex backend (`convex/`)

Schema tables:
- `tags` — focus session categories (name + hex color)
- `sessions` — completed/interrupted focus sessions linked to a tag
- `breaks` — completed/interrupted break sessions (no tag)
- `distractionTags` — categories for distractions
- `distractions` — logged distractions with a time window and tag
- `settings` — single-row table holding `defaultTagId`

All timestamps are Unix milliseconds. Durations are in seconds.

### Pages and routing (`src/App.tsx`)

| Route | Page | Purpose |
|---|---|---|
| `/` | `FocusPage` | Timer UI |
| `/calendar` | `CalendarPage` | `react-big-calendar` session history |
| `/tags` | `TagsPage` | CRUD for focus tags |
| `/distractions` | `DistractionsPage` | Log and review distractions |
| `/stats` | `StatsPage` | Recharts analytics |

All routes share `AppLayout` (sidebar + `<Outlet>`).

### Domain concepts (`CONTEXT.md`)

The **monthly calendar view** segments each day into Morning (05:00–11:59), Afternoon (12:00–17:59), and Evening (18:00–04:59). Sessions are rendered with **Smart Placement** logic: each segment gets a 2-row budget, columns are added as density increases (up to 3 cols + overflow), and the total 6-row budget is split equally among active segments. This logic lives in `src/components/calendar/`.

### Styling

Tailwind CSS v4 via `@tailwindcss/vite` plugin (no `tailwind.config.js` — config is in CSS). Path alias `@` maps to `src/`. Shadcn UI components live in `src/components/ui/`. `components.json` configures the Shadcn CLI.
