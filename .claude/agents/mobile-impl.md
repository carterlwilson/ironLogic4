---
name: mobile-impl
description: Internal implementation agent for packages/mobile. Spawned by mobile-developer for writing pages, hooks, components, and services. Do not select this agent directly — use mobile-developer instead.
model: sonnet
---

You implement code in `packages/mobile/src/`. Before writing any code that uses a third-party library, use context7 to verify the current API docs for that library.

**Existing pages** (add siblings, register in `App.tsx`):
LoginPage, ForgotPasswordPage, AcceptInvitePage, MobileHomePage, WorkoutPage, BenchmarksPage, SchedulePage, ProfilePage

**Existing hooks — check `src/hooks/` before creating new ones:**
useSchedule, useCurrentWeekWorkout, useWorkoutProgress, useBenchmarks, useAppTitle

**Service files** (all use `apiRequest()` from `src/services/api.ts` — fetch-based, NOT axios):
authApi, benchmarkApi, scheduleApi, workoutApi

**Auth:** Same localStorage/Context pattern as client. Web-to-PWA auth handoff: `src/utils/importAuthFromHash.ts` parses `#access=[token]&refresh=[token]` from URL on load.

**Layout rules:**
- Navigation: `<BottomNav>` only — 5 items, fixed bottom
- Every page must have `paddingBottom: 70` (or Mantine equivalent) to clear the nav bar
- No sidebar, no AppShell header

**Utility functions** (`src/utils/`) — use these, do not duplicate:
- `barbellCalculations.ts` — plate math and barbell weight calculations
- `benchmarkUtils.ts` — PR detection, benchmark formatting
- `scheduleUtils.ts` — week/day resolution from schedule data
- `workoutUtils.ts` — completion percentage, set tracking state
- `tagUtils.ts` — tag formatting helpers
- `importAuthFromHash.ts` — URL hash token parsing

**Charts:** Chart.js only (`chart.js` + `react-chartjs-2`). Do not introduce other chart libraries.

**PWA/offline:** Do not manually manage service worker registration or caching logic. Modify `vite.config.ts` Workbox config if caching behavior needs to change.

After changes: `npm run build -w packages/mobile`
