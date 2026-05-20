# Mobile PWA Audit Report

> Generated 2026-04-26. Covers `packages/mobile/src/`.

---

## Critical Bugs

### B1 — `openCreateNewTimeSubMax` and `openCreateNewDistanceSubMax` open the wrong modal
**File:** `packages/mobile/src/hooks/useBenchmarks.ts:380,402`

Both `openCreateNewTimeSubMax` and `openCreateNewDistanceSubMax` call:
```ts
setModalState((prev) => ({ ...prev, isCreateNewRepMaxOpen: true }));
```

They should be setting a distinct open flag — something like `isCreateNewTimeSubMaxOpen` / `isCreateNewDistanceSubMaxOpen`. Instead, they trigger `isCreateNewRepMaxOpen`, which opens `CreateNewRepMaxModal` with whatever data happens to be in `selectedRepMaxForNew` (likely `null`). The actual `CreateNewTimeSubMaxModal` and `CreateNewDistanceSubMaxModal` in `BenchmarksPage.tsx` (lines 256–272) are controlled by `Boolean(selectedTimeSubMaxForNew)` and `Boolean(selectedDistanceSubMaxForNew)` respectively — state that gets set correctly — so those modals open, but the hook also incorrectly opens the rep max modal simultaneously, resulting in two modals appearing at once.

**Fix:** Give each sub-type its own `isCreateNewTimeSubMaxOpen` and `isCreateNewDistanceSubMaxOpen` flag in `modalState`, or remove the flags entirely and control all three "create new from old sub-max" modals purely from the `selectedXForNew !== null` boolean as `BenchmarksPage` already does for time and distance.

---

### B2 — Double `AuthGuard` wrapping with independent 100ms timers
**Files:** `packages/mobile/src/main.tsx:39`; `packages/mobile/src/App.tsx:12`

Every protected route is wrapped in `AuthGuard` twice. `main.tsx` wraps `<App />` in an `AuthGuard`, and `App.tsx` wraps its own content in a second `AuthGuard`. Each instance runs its own `setTimeout(..., 100)` before deciding whether to redirect. On first load this fires two independent redirect decisions. The inner guard mounts after the outer guard has already cleared, so it always sees the same `isAuthenticated` value — but any future change to guard timing (e.g., the delay becoming async) can cause a flash of redirect or a double redirect to `/login`.

More concretely: the inner guard's `useEffect` dependency array is `[initializeAuth]`, but it never actually calls `initializeAuth()` — it only sets a timer. `initializeAuth()` is called by `AuthProvider` on mount, making the dependency stale and the comment misleading. The outer guard is entirely redundant.

**Fix:** Remove `AuthGuard` from `App.tsx`. The guard in `main.tsx` is sufficient.

---

### B3 — `AuthGuard` never calls `initializeAuth` despite listing it as a dependency
**File:** `packages/mobile/src/components/AuthGuard.tsx:14-20`

```tsx
useEffect(() => {
  const timer = setTimeout(() => { setIsInitializing(false); }, 100);
  return () => clearTimeout(timer);
}, [initializeAuth]);
```

`initializeAuth` is in the dependency array but is never invoked inside the effect. `AuthProvider` already calls `initializeAuth()` in its own `useEffect` on mount. The guard's 100ms blind wait is a pure race — if `AuthProvider`'s state update hasn't flushed in 100ms (e.g., on a slow device parsing a large localStorage JSON blob), the guard will incorrectly redirect to `/login` and then snap back, causing a flash.

**Fix:** Remove `initializeAuth` from the dependency array. Add an `isLoading` state to `AuthProvider` that is `true` until the initial `initializeAuth()` call completes, and base the guard's `isInitializing` state on that rather than a blind timeout.

---

### B4 — Service worker registered twice
**Files:** `packages/mobile/src/main.tsx:16-26`; `packages/mobile/vite.config.ts:9`

`vite-plugin-pwa` with `registerType: 'autoUpdate'` injects its own SW registration script into the built HTML at build time (pointing to the Workbox-generated `sw.js`). `main.tsx` additionally registers `/sw.js` manually. The browser ends up with two registration attempts for the same scope, which can cause the SW to reload unexpectedly and discard cached assets. The manual registration also logs success/failure to the console in production.

**Fix:** Remove the manual `navigator.serviceWorker.register` block from `main.tsx` entirely and rely on the plugin's injected registration. If you want to hook into SW lifecycle events, use `workbox-window` (already in `dependencies`) via the plugin's `injectRegister: false` + manual `new Workbox(...)` pattern, or handle events from the plugin's `useRegisterSW` hook.

---

### B5 — `MobileHomePage` is an orphaned page — never rendered
**File:** `packages/mobile/src/pages/MobileHomePage.tsx`

`MobileHomePage` exists and exports a component, but it is not imported or routed anywhere. `App.tsx` redirects `/` to `/workout` and defines no route for `/home`. The file is dead.

---

## Security

### S1 — Auth tokens in localStorage are accessible to any same-origin XSS
**Files:** `packages/mobile/src/providers/AuthProvider.tsx:107-108`; `packages/mobile/src/services/api.ts:63`

Both access tokens and refresh tokens are stored in `localStorage`. While this is a common PWA pattern, it means any JavaScript running on the same origin (e.g., from an XSS via a Mantine tooltip or a compromised CDN) can silently exfiltrate both tokens. The refresh token in particular is long-lived (90 days per the server config), so a single XSS can establish indefinite access.

**Recommendation:** Consider storing the access token in memory only (short-lived, acceptable to re-mint from refresh) and keeping only the refresh token in `localStorage` (or `sessionStorage` if cross-tab persistence is not needed). This limits the blast radius of XSS to the refresh token lifetime.

---

### S2 — `importAuthFromHash` trusts `atob`-decoded JSON without verifying its origin
**File:** `packages/mobile/src/utils/importAuthFromHash.ts:17-41`

The cross-app auth import reads `#auth=<base64>` from the URL and immediately stores the decoded tokens and user object into `localStorage` with no signature or HMAC verification. Any link of the form `https://mobile.app/#auth=<attacker-base64>` — sent via phishing or open redirect — can plant arbitrary tokens and user identity into the app's auth state. The only validation is that `tokens.accessToken` and `user.id` are truthy strings.

**Fix:** Validate the imported tokens against the server (e.g., call the existing `/api/auth/validate` endpoint) before storing them. Alternatively, verify a short-lived HMAC that the client app embeds in the payload.

---

### S3 — `AcceptInvitePage` writes tokens/user to `localStorage` bypassing `AuthProvider`
**File:** `packages/mobile/src/pages/AcceptInvitePage.tsx:94-102`

After a successful invite acceptance, the page writes directly to `localStorage` and calls `navigate('/')`. The `AuthProvider` React state is never updated — `isAuthenticated` remains `false` in memory. Any component that reads from the context (rather than localStorage) will see the user as logged out until the page refreshes or `initializeAuth()` is called again. Currently `AuthGuard` only runs its 100ms timer once on mount, so the user lands on the workout page appearing authenticated (because `AuthGuard` no longer checks), but the context is stale.

**Fix:** Expose an `authenticate(tokens, user)` method on `AuthContext` that updates both `localStorage` and React state atomically, and call it from `AcceptInvitePage`.

---

### S4 — Source maps shipped to production
**File:** `packages/mobile/vite.config.ts:63`

```ts
build: {
  sourcemap: true,
}
```

Production builds include full source maps. While not directly exploitable, this exposes your entire application source code, logic, API endpoint paths, and business rules to anyone who opens DevTools. The server audit found similar findings.

**Fix:** Set `sourcemap: false` for production, or use `sourcemap: 'hidden'` and upload maps to a private error-tracking service (e.g., Sentry).

---

## Performance

### P1 — `loadBenchmarks` and `loadTemplates` make redundant parallel API requests on mount
**File:** `packages/mobile/src/hooks/useBenchmarks.ts:446-449`

On mount, `useBenchmarks` fires two requests simultaneously: `GET /api/me/benchmarks` (which already returns `templates` in its response body — see `GetBenchmarksResponse` in `benchmarkApi.ts:10-17`) and `GET /api/gym/benchmark-templates/all`. The hook then stores templates in two separate places: `state.templates` (from the `/all` endpoint) and `benchmarkTemplates` (the `Map` built from the benchmarks response). `state.templates` feeds `CreateBenchmarkModal`; `benchmarkTemplates` feeds `BenchmarkCard`.

The `/all` endpoint call is redundant — the data is already in the benchmarks response. Additionally, each time a modal is opened that requires full template detail, `getBenchmarkTemplate(id)` fires yet another request, even though the full template data could be passed from the already-fetched list.

**Fix:** Remove `loadTemplates` / `getBenchmarkTemplates` and build both the `Map` and the flat `templates` array from the single benchmarks response. Eliminate the separate `/all` call.

---

### P2 — `handleJoinTimeslot` and `handleLeaveTimeslot` capture stale `state.schedules` via closure
**File:** `packages/mobile/src/hooks/useSchedule.ts:87,165`

Both callbacks close over `state.schedules` for the rollback value:
```ts
const previousSchedules = state.schedules;
```

Because `state` is captured at the time the callback was created (per `useCallback`'s deps), if the schedules have been updated since the callback was last recreated (and `state.schedules` is listed in the dependency array at line 154 and 233, causing frequent recreation), a rapid double-tap can capture the post-first-request state as the "previous" state for the second request. The optimistic update then rolls back to the wrong state on failure.

The bigger impact is that listing `state.schedules` in `useCallback` dependencies means every schedule state change recreates both handlers, forcing every child that receives them as props to re-render unnecessarily.

**Fix:** Use a ref to capture the pre-optimistic state for rollback, or use a functional state update pattern. Remove `state.schedules` from the `useCallback` dependency array and instead read it from a ref inside the callback.

---

### P3 — Benchmark filtering is duplicated in `useEffect` with derived state
**File:** `packages/mobile/src/pages/BenchmarksPage.tsx:73-90`

The component maintains `filteredCurrentBenchmarks` and `filteredHistoricalBenchmarks` as `useState` values updated inside a `useEffect` that watches `currentBenchmarks`, `historicalBenchmarks`, `selectedTag`, and `searchQuery`. This is the anti-pattern: derived state in `useEffect`. Every state change triggers an extra render cycle (state update → re-render → effect → setState → re-render).

**Fix:** Replace the `useEffect` + two `useState` calls with two `useMemo` calls.

---

### P4 — `BenchmarkProgressChart` fetches on every render when `templateId` is stable but component re-mounts
**File:** `packages/mobile/src/components/benchmarks/BenchmarkProgressChart.tsx:38-55`

The chart is rendered inside a `Collapse` inside `BenchmarkProgressList`. When the user collapses and re-expands a benchmark, the component unmounts and remounts, re-firing the `getBenchmarkProgress` API call. For a user who frequently checks charts, this is an unbounded number of fetches for data that almost never changes.

**Fix:** Lift the chart data fetch up to `BenchmarkProgressList` (or cache it via `useRef` inside `BenchmarkProgressChart`) so that re-mounting does not re-fetch already-loaded data.

---

### P5 — Workout progress persisted on every set completion, synchronously in the render cycle
**File:** `packages/mobile/src/hooks/useWorkoutProgress.ts:104`

`persistDayProgress` calls `localStorage.setItem` directly inside a `setProgress` updater function. While the updater runs outside the render, `localStorage` I/O is synchronous and blocking. On mobile Safari with a large progress object, this can introduce jank during set completion taps.

**Fix:** Move the `persistDayProgress` call out of the state updater and into a `useEffect` that watches `progress`, or debounce/defer it with `setTimeout(..., 0)`.

---

### P6 — `RestTimer` updates every 100ms unconditionally, causing constant re-renders while active
**File:** `packages/mobile/src/components/workout/RestTimer.tsx:14-22`

The interval fires 10 times per second. Each tick calls `setElapsedSeconds`, which re-renders `RestTimer`. Since `RestTimer` is rendered inside `WorkoutPage` (which also renders the full `ActivityList`), and because `ActivityList` receives new function references on every parent render, this could cause the entire workout list to check for re-renders 10 times per second while the timer is active.

**Fix:** Wrap `ActivityList`'s component and its props callbacks in `memo`/`useCallback` so the timer ticks don't propagate down. The interval itself could also be reduced to 1000ms since the display only changes once per second — the extra ticks buying nothing.

---

### P7 — Runtime Workbox cache pattern never matches in development or on localhost deployments
**File:** `packages/mobile/vite.config.ts:38`

```ts
urlPattern: /^https:\/\/api\./
```

This pattern matches only URLs starting with `https://api.` — i.e., a subdomain named `api`. The app's API calls go to `VITE_API_URL` (defaulting to `http://localhost:3001`) and in production likely to something like `https://api.example.com`. The pattern will match a production deployment hosted at `api.*` but will silently fail to cache anything on localhost or on non-`api.`-subdomain deployments (e.g., `https://app.example.com/api/*`). There is no indication this has ever cached any API response in practice.

**Fix:** Change the pattern to match the actual API URL structure:
```ts
urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
```

---

## Duplicate / Redundant Code

### D1 — `formatTime` / `formatTimeSeconds` defined twice with identical output
**Files:** `packages/mobile/src/utils/workoutUtils.ts:4`; `packages/mobile/src/utils/benchmarkUtils.ts:203`

Both produce `MM:SS` from a seconds integer with identical logic. `workoutUtils.formatTime` uses `String(n).padStart`; `benchmarkUtils.formatTimeSeconds` uses `n.toString().padStart`. Both are imported by different consumers (`RestTimer` uses the former; `CardioActivityCard` uses the latter).

**Fix:** Keep one (the shared package would be ideal; failing that, keep `benchmarkUtils.formatTimeSeconds` since it has more callers) and update the other import site.

---

### D2 — Unrecorded sub-max placeholder card is copy-pasted three times in `BenchmarkCard`
**File:** `packages/mobile/src/components/benchmarks/BenchmarkCard.tsx:310-358; 406-450; 499-548`

The "Not recorded yet" placeholder card with its `isHistorical` / `isEditable` conditional icon appears verbatim three times — once each for `WEIGHT` (rep maxes), `DISTANCE` (time sub-maxes), and `TIME` (distance sub-maxes). The only variation is the `onClick` handler and the item name. ~130 lines that could be ~20.

**Fix:** Extract a `UnrecordedSubMaxCard` component that accepts `name`, `isHistorical`, `isEditable`, and the two action callbacks.

---

### D3 — `getCardColor()` pattern repeated identically across three activity card components
**Files:** `packages/mobile/src/components/workout/LiftActivityCard.tsx:47`; `CardioActivityCard.tsx:19`; `OtherActivityCard.tsx:19`

All three define:
```ts
const getCardColor = () => {
  if (progress.completed) return 'green.0';
  return undefined;
};
```
`LiftActivityCard` adds one extra line for `anySetsComplete`. This is minor but the same helper could be a one-liner utility.

---

### D4 — `getBenchmarkTypeColor` / `getBenchmarkTypeLabel` defined locally in `BenchmarkProgressList`
**File:** `packages/mobile/src/components/benchmarks/BenchmarkProgressList.tsx:17-45`

These two switch-statement helpers could be shared utilities in `benchmarkUtils.ts` but are instead defined as module-level functions inside a component file, unavailable to anything else.

---

### D5 — Benchmark modal reset logic is copy-pasted into every modal's `useEffect` and `handleClose`
**Files:** `CreateBenchmarkModal.tsx`, `EditBenchmarkModal.tsx`, `CreateNewFromOldModal.tsx`

Every modal runs nearly the same reset sequence (`form.reset()`, `setSelectedTemplate(null)`, `setFullTemplate(null)`, `setRepMaxValues({})`, etc.) in both the `opened` effect and `handleClose`. A shared `resetState()` helper inside each component would reduce the repetition.

---

## Bad Logic / Bugs

### L1 — `onActivityComplete` prop accepted by `LiftActivityCard` but never called
**File:** `packages/mobile/src/components/workout/LiftActivityCard.tsx:14,21`

The interface declares `onActivityComplete: (activityId: string) => void` and it is destructured from props, but it is never invoked anywhere in the component. `LiftActivityCard` has no "Mark Complete" button for the whole activity — only individual set buttons that call `onSetComplete`. This means a lift activity can never be marked as `progress.completed = true` through the UI, so the "Complete" badge and green card background for lift activities are unreachable states.

**Fix:** Add an "All Sets Complete" / "Mark Activity Complete" button that calls `onActivityComplete(activity.id)`, or remove the prop from the interface.

---

### L2 — `AuthProvider`'s `initializeAuth` never marks token expiry
**File:** `packages/mobile/src/providers/AuthProvider.tsx:178-232`

When restoring from `localStorage`, the provider sets `isAuthenticated: true` without checking whether the stored `accessToken` is expired. If the user was offline for longer than the access token TTL (typically 15 minutes) and the app is reopened, the first API call will get a 401 and trigger a token refresh — correct. But if the refresh token is also expired (90-day window) and the user is offline at that moment, `refreshAccessToken()` will fail with a network error, which causes `localStorage.removeItem` + `window.location.href = '/login'` in `api.ts:51-55`. This navigation happens outside React, leaves any open modals or dirty form state without cleanup, and can loop if the login page itself triggers any protected API call.

---

### L3 — Rollback in `handleJoinTimeslot` may overwrite fresh data from `loadSchedules`
**File:** `packages/mobile/src/hooks/useSchedule.ts:132-138`

The optimistic flow is: set loading → optimistic update → `await joinTimeslot()` → `await loadSchedules()`. The error handler rolls back to `previousSchedules` (captured before the optimistic update). But `previousSchedules` is captured from the closure — if another concurrent operation updated `state.schedules` between the optimistic update and the error handler, the rollback overwrites that newer state. The `finally` block also sets the action loading correctly. But if `loadSchedules()` succeeds and then the catch runs (theoretically impossible unless the try swallows both), the server state would be overwritten. The real issue is that the rollback target is stale state, not the server truth.

**Fix:** After an error, call `loadSchedules()` inside the catch block instead of restoring from the closure snapshot. This guarantees server-consistent state.

---

### L4 — Workout `selectedDay` index can go out of bounds when new data loads
**File:** `packages/mobile/src/pages/WorkoutPage.tsx:31-33`

```ts
const [selectedDay, setSelectedDay] = useState(0);
const weekId = data?.currentWeek.id;
const dayId = data?.currentWeek.days[selectedDay]?.id;
```

If `data` refreshes (e.g., after `refetch`) and the new week has fewer days, `selectedDay` can be out of range. `dayActivities` would silently return `[]` (the optional chain saves from a crash) but `dayId` becomes `undefined`, which causes `useWorkoutProgress` to clear progress state. The user would see their progress vanish.

**Fix:** When `data` updates, clamp `selectedDay` to `Math.min(selectedDay, data.currentWeek.days.length - 1)`.

---

### L5 — `useCurrentWeekWorkout`'s `fetchData` function is not stable (re-created every render) but is exposed as `refetch`
**File:** `packages/mobile/src/hooks/useCurrentWeekWorkout.ts:17-29`

`fetchData` is a plain `async function` inside the hook body, not wrapped in `useCallback`. It is both referenced in a `useEffect` dependency array (line 32) and returned as `refetch`. Because it is re-created on every render, the effect is re-triggered on every render, causing an infinite fetch loop... except that it only runs once because `useEffect`'s dependency array in this case is `[]` (empty). The `fetchData` reference in the array `[fetchData]` at line 32 is actually `[]` — wait, line 32 says `}, []);` with no deps, so the loop does not occur. However, `refetch` being unstable means any component that stores it in a `useCallback` dependency will needlessly re-create callbacks on every render.

**Fix:** Wrap `fetchData` in `useCallback(fetchData, [])`.

---

### L6 — `useAppTitle` is used only on `LoginPage`, which is a public route before auth
**File:** `packages/mobile/src/hooks/useAppTitle.ts:3-10`; `packages/mobile/src/pages/LoginPage.tsx:29`

`useAppTitle` reads `user.gymName` from auth context to display the gym name. On the login page, `user` is always `null`, so it always returns `'IronLogic'` — not the gym name. The gym name would only be available after login, at which point the user leaves this page. The hook is technically correct but effectively dead code on its only call site.

---

### L7 — `BenchmarkProgressList` only shows progress for `currentBenchmarks`, not `historicalBenchmarks`
**File:** `packages/mobile/src/pages/BenchmarksPage.tsx:178`; `packages/mobile/src/components/benchmarks/BenchmarkProgressList.tsx:47`

`BenchmarkProgressList` is rendered in the "Historical" tab:
```tsx
<Tabs.Panel value="historical">
  <BenchmarkProgressList currentBenchmarks={filteredCurrentBenchmarks} />
</Tabs.Panel>
```

It receives only `filteredCurrentBenchmarks` (not historical), so the "Historical" tab shows progress charts for current benchmarks, not historical ones. This is presumably the intended UX (chart all versions of a benchmark), but the naming is confusing — `currentBenchmarks` prop passed to a component displayed in a "historical" tab.

---

### L8 — `CreateBenchmarkModal`'s `useEffect` calls `form.reset()` but suppresses the linter warning
**File:** `packages/mobile/src/components/benchmarks/CreateBenchmarkModal.tsx:88`

The `useEffect` on line 78-88 has `form` in scope but not in the dependency array. The comment `// eslint-disable-next-line react-hooks/exhaustive-deps` on `AcceptInvitePage.tsx:79` suppresses a legitimate warning. In `CreateBenchmarkModal`, `form.reset()` and `form.setFieldValue()` are called inside `useEffect([opened])` without `form` in deps. `useForm` from `@mantine/form` returns a stable reference across renders, so this does not actually cause bugs, but it is a brittle pattern that will break if `useForm`'s stability guarantee ever changes.

---

## Unused Imports / Dead Code

| Location | Issue |
|---|---|
| `packages/mobile/src/pages/MobileHomePage.tsx` | Entire file is dead — never imported or routed |
| `packages/mobile/src/components/workout/LiftActivityCard.tsx:14` | `onActivityComplete` prop declared and destructured, never called |
| `packages/mobile/src/hooks/useAppTitle.ts` | Only caller is `LoginPage` where `user` is always `null`, so it always returns the fallback |
| `packages/mobile/package.json` | `dayjs` is a listed dependency (`^1.11.19`) but is never imported in `src/` — installed for nothing |
| `packages/mobile/package.json` | `workbox-build`, `workbox-precaching`, `workbox-routing`, `workbox-strategies` are listed as dev dependencies but no custom SW file in `src/` imports them — `vite-plugin-pwa` bundles its own Workbox copy |
| `packages/mobile/package.json` | `workbox-window` in production dependencies is unused in `src/` — the manual SW registration in `main.tsx` uses raw `navigator.serviceWorker.register` instead |
| `packages/mobile/src/services/benchmarkApi.ts:42-51` | `GetBenchmarkProgressResponse` interface defined but never used as a typed variable — only `result.data` is returned inline |
| `packages/mobile/src/components/benchmarks/BenchmarkProgressList.tsx:11-15` | Local `BenchmarkTemplate` interface shadows the imported type from `@ironlogic4/shared` (different import path; only `templateId`, `name`, `type` fields retained) |
| `packages/mobile/src/components/benchmarks/BenchmarkCard.tsx:53-59` | `formatMeasurement` called with `distanceSubMaxes` argument missing — the function accepts it as param 8, but call site on line 59 only passes 7 args (stops at `timeSubMaxes`). `DISTANCE`-type measurements will display as `'No data'` instead of the correct count. |

---

## PWA / Service Worker

### SW1 — `registerType: 'autoUpdate'` silently replaces the active SW without user consent
**File:** `packages/mobile/vite.config.ts:9`

`autoUpdate` causes the new service worker to skip waiting and immediately take control on the next navigation, discarding any in-progress requests. For a workout tracking app where a user may be mid-set and the network is spotty, an unannounced cache swap can change API response shapes under the user. Consider `registerType: 'prompt'` with a notification to reload, giving users control over when the update activates.

---

### SW2 — No `navigationFallback` configured — deep links fail when offline
**File:** `packages/mobile/vite.config.ts:33-48`

`vite-plugin-pwa`'s Workbox config has no `navigationFallback: '/index.html'`. When a user opens the app offline via a bookmarked deep link (e.g., `/benchmarks`), the service worker has no navigation fallback instruction and the browser will show a network error page instead of the cached SPA shell.

**Fix:** Add `navigateFallback: '/index.html'` to the `workbox` config block.

---

## Test Infrastructure

No test files exist. `vitest` is installed and `npm run test` is a defined script, but there is zero coverage. Given the complexity of `useBenchmarks` (40+ return values, 3 sub-max types, interleaved create/edit/delete flows) and the modal orchestration bugs found above (B1), this is where test coverage would pay off most.
