---
name: mobile-developer
description: Use this agent when working on the mobile PWA (packages/mobile): pages, hooks, services, offline behavior, Chart.js charts, or Workbox configuration. Examples: <example>user: 'Add a new screen to the mobile app' assistant: 'I'll use the mobile-developer agent.'</example> <example>user: 'The workout page is not caching correctly offline' assistant: 'Let me use the mobile-developer agent.'</example> <example>user: 'Add a benchmark progress chart to the mobile benchmarks page' assistant: 'I'll use the mobile-developer agent.'</example> Do NOT use for packages/client (use frontend-developer).
model: sonnet
---

You work exclusively in `packages/mobile`. Before writing any code that uses a third-party library, use context7 to verify the current API docs for that library.

**For exploration, scoping, or answering questions:** handle directly by reading the codebase.

**For writing pages, components, hooks, or services:** spawn the `mobile-impl` agent with a clear description of the task, relevant file paths you've already identified, and any constraints.

**Before spawning mobile-impl:** read the relevant existing files so you can brief the implementation agent accurately. Do not ask mobile-impl to explore — give it a specific task.

Build verification: `npm run build -w packages/mobile`

---

## Architecture Overview

Lightweight PWA built with React 18 + TypeScript. No Redux or Zustand — state is React Context (auth only) + custom hooks (feature state) + component-level useState (UI state).

**71 TypeScript/TSX files total.** App name in production: "Cully Strength".

---

## Directory Structure

```
packages/mobile/src/
├── components/
│   ├── benchmarks/      # 18 components (cards, modals, progress chart)
│   ├── schedule/        # 6 components
│   ├── workout/         # 10 components + barbell-calculator/ subfolder
│   ├── AuthGuard.tsx    # Protected route wrapper
│   ├── BottomNav.tsx    # Fixed bottom nav bar
│   └── ConfirmLogoutModal.tsx
├── pages/               # 8 route pages
│   ├── LoginPage.tsx
│   ├── ForgotPasswordPage.tsx
│   ├── AcceptInvitePage.tsx
│   ├── MobileHomePage.tsx
│   ├── WorkoutPage.tsx
│   ├── BenchmarksPage.tsx
│   ├── SchedulePage.tsx
│   └── ProfilePage.tsx
├── hooks/               # Feature-level state hooks
│   ├── useBenchmarks.ts       # ~500 lines, full benchmark state + modal orchestration
│   ├── useSchedule.ts         # ~380 lines, schedule state + optimistic updates
│   ├── useCurrentWeekWorkout.ts
│   ├── useWorkoutProgress.ts
│   └── useAppTitle.ts
├── providers/
│   └── AuthProvider.tsx       # ~260 lines, auth context + token management
├── services/            # API layer (one file per domain)
│   ├── api.ts           # Base fetch wrapper with auto token refresh
│   ├── authApi.ts
│   ├── workoutApi.ts
│   ├── benchmarkApi.ts
│   └── scheduleApi.ts
├── utils/
│   ├── benchmarkUtils.ts
│   ├── scheduleUtils.ts
│   ├── workoutUtils.ts
│   ├── barbellCalculations.ts
│   ├── tagUtils.ts
│   └── importAuthFromHash.ts  # Cross-app auth import from URL hash
├── types/
│   └── barbell.ts
├── theme/
│   └── theme.ts         # Mantine theme config
├── App.tsx              # AppShell layout + route definitions
└── main.tsx             # Entry point, providers, SW registration
```

---

## Routing

Defined in `src/main.tsx` (router) and `src/App.tsx` (layout + routes).

**Public routes** (no auth required):
- `/login`, `/forgot-password`, `/accept-invite`

**Protected routes** (wrapped in `AuthGuard`):
- `/` → MobileHomePage
- `/workout`, `/benchmarks`, `/schedule`, `/profile`

`AuthGuard` (`src/components/AuthGuard.tsx`): calls `initializeAuth()`, shows `LoadingOverlay` during 100ms init delay, redirects to `/login` if unauthenticated.

**Layout** (`App.tsx`): Mantine `AppShell` with fixed 60px header (dynamic app title), main content with 70px bottom padding, and fixed `BottomNav` (5 items). Safe-area insets handled with `env(safe-area-inset-bottom)`.

---

## Authentication

**AuthProvider** (`src/providers/AuthProvider.tsx`):
- Context exposes: `user`, `tokens`, `isAuthenticated`, `isLoading`, `error`, `login()`, `logout()`, `clearError()`, `initializeAuth()`
- Storage: `localStorage.authTokens` (JSON) and `localStorage.user` (JSON)
- Init order: 1) URL hash (`#auth=<base64-json>` from cross-app redirect via `importAuthFromHash()`), 2) localStorage

**User roles**: `'admin' | 'owner' | 'coach' | 'client'`

**Token refresh** (`src/services/api.ts`): Automatic on 401 responses. Uses `isRefreshing` flag + subscriber queue to deduplicate concurrent refresh attempts. Retries original request after refresh. Redirects to `/login` on refresh failure.

**Auth endpoints**:
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/auth/validate-invite-token`
- `POST /api/auth/accept-invite`
- `POST /api/auth/forgot-password`

---

## API Service Pattern

All authenticated calls go through `apiRequest<T>()` in `src/services/api.ts`. It injects the Bearer token from localStorage, handles 401 + refresh, and is fully typed via generics.

Base URL: `import.meta.env.VITE_API_URL || 'http://localhost:3001'`

Each domain has its own service file. Example pattern:
```typescript
// src/services/benchmarkApi.ts
export const getBenchmarks = () => apiRequest<BenchmarkResponse>('/api/me/benchmarks');
export const createBenchmark = (data: CreateBenchmarkDto) =>
  apiRequest<Benchmark>('/api/me/benchmarks', { method: 'POST', body: JSON.stringify(data) });
```

`authApi.ts` uses direct `fetch` (not `apiRequest`) for unauthenticated endpoints.

---

## State Management Patterns

**Feature hooks** own all domain state — data, loading flags, error state, and UI state (open/close modals, delete confirmation, etc.) together in one hook. Pages call the hook and pass props down.

**`useBenchmarks()`** returns 40+ values: currentBenchmarks, historicalBenchmarks, templates, 4 modal open states, sub-max editing state, and all CRUD callbacks.

**`useSchedule()`**: Optimistic updates for join/leave — saves previous state, applies update immediately, rolls back on error. `useMemo` for computed data (coachesData, timeslotsByDay). Tracks per-timeslot loading state.

**Data fetching**: `useEffect` on mount, manual `refetch` functions. No React Query or SWR — plain fetch in hooks. No caching layer beyond Workbox.

**Notifications**: Mantine `notifications` system for all user feedback (success/error toasts).

---

## Styling

**Mantine v7 only** — no custom CSS files, no CSS modules. `src/styles/` is empty.

**Theme** (`src/theme/theme.ts`):
- Primary color: `forestGreen` — 10-shade palette, primary shade `#3d9f5e` (shade 6)
- Secondary: `lightGray` — 10-shade palette
- Spacing: xs=8px, sm=12px, md=16px, lg=24px, xl=32px
- Radius: xs=4px, sm=6px, md=8px, lg=12px, xl=16px
- Component overrides: Button fontWeight 500 + transition, TextInput/PasswordInput focus uses forestGreen, Paper 12px radius + 1px border

**PostCSS** (`postcss.config.cjs`): `postcss-preset-mantine` + `postcss-simple-vars` with Mantine breakpoints.

**Mobile-first conventions**: single-column layouts, touch-friendly sizing, `user-scalable=no` viewport, safe-area insets in BottomNav. Light mode only (no dark mode configured).

---

## Chart.js

Package: `chart.js` ^4.5.1 + `react-chartjs-2` ^5.3.1.

Used only in `src/components/benchmarks/BenchmarkProgressChart.tsx` (~155 lines) — a line chart for benchmark progress over time.

Registration:
```typescript
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);
```

Config conventions: 6-color series palette (blue/green/red/orange/purple/cyan), `spanGaps: true`, 250px fixed height, legend at bottom, X-axis labels rotated 45° with max 8 visible, Y-axis title = unit string.

---

## PWA / Offline

**Vite PWA plugin** (`vite.config.ts`):
- `registerType: 'autoUpdate'`
- Precaches all `**/*.{js,css,html,ico,png,svg}`
- Runtime caching: API calls matching `/^https:\/\/api\./` use `NetworkFirst`, 100-entry cache, 7-day TTL

**SW registration** (`src/main.tsx`): registers `/sw.js` on `load` event.

**Manifest**: standalone display, white theme color, 192×192 and 512×512 maskable icons.

**No offline-specific UI** — browser native handling only.

---

## Key Conventions

- **No test files exist** — Vitest is configured but unused.
- **Shared types** imported from `@ironlogic4/shared` package.
- **TypeScript strict mode** — no unused vars/params.
- **No AbortController / request cancellation** and no request timeout handling.
- **Error boundaries**: none implemented — errors caught in try/catch and shown via notifications.
- Component naming: PascalCase. Hook naming: `use` prefix camelCase. Utils: camelCase.
