# Client Package Audit Report

> Generated 2026-05-05. Covers `packages/client/src/`.

---

## Critical Bugs

### B1 — `AuthProvider` initializes `isLoading: false` before auth is checked, causing `AuthGuard` to redirect on first paint
**File:** `packages/client/src/providers/AuthProvider.tsx:54`; `packages/client/src/components/AuthGuard.tsx:13-19`

```ts
// AuthProvider initial state
const [authState, setAuthState] = useState<AuthState>({
  user: null,
  tokens: null,
  isLoading: false,      // ← starts false even though auth hasn't been checked yet
  error: null,
  isAuthenticated: false,
});
```

`AuthGuard` checks `isLoading` to decide whether to show a spinner or redirect. Because the initial state has `isLoading: false` and `isAuthenticated: false`, the guard immediately renders `<Navigate to="/login" replace />` on the very first render — before `initializeAuth()` (called inside a `useEffect`) has run. Users with valid stored tokens will see a flash redirect to `/login` before the context catches up. On fast machines the redirect happens so quickly it may be invisible, but it still pollutes the browser history and can break the back-button flow.

**Fix:** Initialize `isLoading: true` in the `AuthState` initial value, and set it to `false` at the end of `initializeAuth()` (both success and failure paths). `AuthGuard` will then correctly wait for the first check to complete before deciding whether to redirect.

---

### B2 — `CreateBenchmarkModal` leaves the button permanently disabled if `onCreate` throws
**File:** `packages/client/src/components/benchmarks/CreateBenchmarkModal.tsx:118-215`

`handleSubmit` calls `setLoading(true)` at the top, then `await onCreate(data)`, then `setLoading(false)` at line 215. There is no `try/catch/finally` wrapping the `onCreate` call. If `onCreate` rejects (e.g. a network error), the `setLoading(false)` on line 215 is never reached. The modal's submit button stays in a permanent loading/disabled state until the modal is closed and reopened.

**Fix:** Wrap the `await onCreate(data)` block in a `try/finally` and move the cleanup (`form.reset()`, `setLoading(false)`) to the `finally` block, or at minimum ensure `setLoading(false)` is called in the catch path.

---

### B3 — `ClientBenchmarksPage` constructs benchmark objects with client-generated `Date.now()` IDs then writes them directly to the server
**File:** `packages/client/src/pages/ClientBenchmarksPage.tsx:77-99`

```ts
const newBenchmark: ClientBenchmark = {
  ...benchmarkData,
  id: Date.now().toString(), // Temporary ID, server will replace
  createdAt: new Date(),
  updatedAt: new Date(),
};
// Then immediately:
await clientApi.updateClient(client.id, {
  currentBenchmarks: [...(client.currentBenchmarks || []), newBenchmark],
});
```

The entire `currentBenchmarks` array — including the fake `Date.now()` ID — is sent to the server via `updateClient` (a PATCH). The server receives an array element with an externally-generated numeric-string ID and no `templateId`, `type`, or other domain fields that a proper benchmark-creation endpoint would enforce. This bypasses any server-side validation that `POST /api/clients/:id/benchmarks` would apply. If the server persists this ID, future operations that look up the benchmark by ID (edit, move, delete) will use this fake ID, which could collide across concurrent requests.

**Fix:** The server should expose a `POST /api/clients/:clientId/benchmarks` endpoint that generates the ID. The page should call that instead of constructing a `ClientBenchmark` object client-side and embedding it in a full-array update.

---

### B4 — `tokenRefresh.ts` does not update `AuthProvider` React state when tokens are refreshed
**File:** `packages/client/src/services/tokenRefresh.ts:42-49`

When `refreshAccessToken()` succeeds, it writes the new tokens directly to `localStorage` (line 48) but never calls any setter or context update in `AuthProvider`. The provider's in-memory `authState.tokens.accessToken` becomes stale. Any code that reads `tokens` from the auth context (rather than re-reading localStorage) will use the old, expired access token.

**Fix:** Either expose a `setTokens(tokens)` method on `AuthContext` that `tokenRefresh.ts` can call after a successful refresh, or restructure so token management lives entirely inside the provider (the service layer asks the provider to make authenticated requests rather than independently managing localStorage).

---

## Security

### S1 — Both access and refresh tokens stored in `localStorage` — full exposure to XSS
**Files:** `packages/client/src/providers/AuthProvider.tsx:75-76`; `packages/client/src/services/tokenRefresh.ts:21-24`

Tokens are stored with `localStorage.setItem('authTokens', ...)` and read by the service layer directly. Any same-origin script injection can silently exfiltrate both tokens. The refresh token is long-lived (90 days per server config) and allows minting fresh access tokens indefinitely.

**Recommendation:** Store the access token in memory only (the `AuthProvider` state is sufficient). Keep only the refresh token in `localStorage` (or `sessionStorage` for session-scoped persistence). The service layer should ask the provider for the current access token via context or a ref, rather than reading localStorage directly.

---

### S2 — `redirectToMobile` embeds auth tokens in the URL fragment — exfiltration via Referer header and browser history
**File:** `packages/client/src/utils/redirectToMobile.ts:19-22`

```ts
const authData = btoa(JSON.stringify({ tokens, user }));
window.location.href = `${mobileAppUrl}#auth=${authData}`;
```

Although hash fragments are not sent to servers in normal `Referer` headers, they are visible in browser history, DevTools network panel, and any JavaScript on the target page that reads `window.location.hash`. If `mobileAppUrl` ever loads third-party scripts (analytics, error tracking), those scripts can read the hash and exfiltrate tokens. There is also no expiry on the encoded payload — a cached link with the hash remains valid until the refresh token expires.

**Fix:** Generate a short-lived (60-second) one-time handoff token server-side at login time, pass only that token in the URL fragment, and have the mobile app exchange it immediately for real tokens via an API call.

---

### S3 — Source maps shipped to production
**File:** `packages/client/vite.config.ts:16`

```ts
build: {
  outDir: 'dist',
  sourcemap: true,
}
```

Full source maps expose all application logic, API endpoint paths, business rules, and potentially environment variable names that were inlined by Vite.

**Fix:** Set `sourcemap: false` for production, or use `sourcemap: 'hidden'` with maps uploaded to a private error tracking service such as Sentry.

---

### S4 — `authApi.ts` does not handle non-2xx responses from `forgotPassword` or `resetPassword`
**File:** `packages/client/src/services/authApi.ts:9-16`

```ts
export async function forgotPassword(email: string): Promise<ApiResponse<void>> {
  const response = await fetch(`${API_BASE}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return response.json();  // ← no response.ok check
}
```

If the server returns a 5xx error, `response.json()` will either fail (if the body is not JSON) or silently return the error body as if it were a success response. The inconsistency makes error handling fragile.

**Fix:** Add `if (!response.ok) { throw new Error(...) }` guards in `authApi.ts`, consistent with how other service files handle errors.

---

## Performance

### P1 — `ProgramListPage` calls `refetch()` inside a `useEffect` on mount — double-fetches on every mount
**File:** `packages/client/src/pages/Programs/ProgramListPage.tsx:22-25`

```ts
const { data, isLoading, refetch } = useProgramList(params);

useEffect(() => {
  refetch();
}, [refetch]);
```

`useProgramList` uses TanStack Query's `useQuery`, which already fetches automatically on mount when the query is enabled. Adding `refetch()` inside a `useEffect` causes a second network request every time the component mounts.

**Fix:** Remove the `useEffect(() => { refetch(); }, [refetch])` block entirely. `useQuery` will handle the initial fetch automatically. If cache invalidation after a mutation is needed, do it in the mutation's `onSuccess` callback.

---

### P2 — `ProgramDetailPage` passes unstable function references down 4 levels of component tree, defeating memoization
**File:** `packages/client/src/pages/Programs/ProgramDetailPage.tsx:35-45,106-138`

`toggleExpanded` (line 35) and `handleProgramChange` / `handleProgramChangeWithAutoSave` (lines 106, 110) are plain functions defined in the render body — not wrapped in `useCallback`. They are passed through `BlockList` → `BlockItem` → `WeekItem` → `DayItem` → `ActivityCard` (a 4-level chain). On every state update, all four levels re-render even if the data they display hasn't changed. Given a program can have dozens of activities, this chain re-renders every activity on every keystroke.

**Fix:** Wrap all three callbacks in `useCallback`. `toggleExpanded` has no dependencies; `handleProgramChange` has no dependencies (it calls `setLocalProgram`); `handleProgramChangeWithAutoSave` depends on `programId` and `updateProgramStructure`.

---

### P3 — `getBenchmarkTemplate` is called independently by 5 different modal components every time they open, with no caching
**Files:** `CreateBenchmarkModal.tsx:79`; `EditBenchmarkModal.tsx:104`; `CreateNewFromOldModal.tsx`; `clientBenchmarks/CreateBenchmarkFromTemplateModal.tsx`; `clientBenchmarks/EditBenchmarkModal.tsx`

All five modals call `getBenchmarkTemplate(templateId)` directly via `fetch` inside a `useEffect` when they open, with no caching layer. The same template can be fetched repeatedly across multiple open/close cycles, and two modals mounted simultaneously for the same template will fire two parallel requests.

**Fix:** Wrap `getBenchmarkTemplate` with TanStack Query (`useQuery({ queryKey: ['benchmarkTemplate', templateId], queryFn: ... })`), which provides automatic caching and deduplication, or cache fetched templates in a module-level `Map` with a short TTL.

---

### P4 — `useActivityTemplateMap` and `useActivityGroups` use raw fetch with no caching; refetch on every mount of `ProgramDetailPage`
**Files:** `packages/client/src/hooks/useActivityTemplateMap.ts`; `packages/client/src/hooks/useActivityGroups.ts`

Both hooks use raw `useState` + `useEffect` + direct API calls with no caching. Every time `ProgramDetailPage` mounts, both API calls fire again. The program data itself uses TanStack Query (with `staleTime`), so it benefits from the cache — but the template and group data it depends on does not.

**Fix:** Convert both hooks to use `useQuery` from TanStack Query (already installed). A 5-minute `staleTime` is appropriate since activity templates and groups change infrequently.

---

### P5 — `useOwnerMapping` calls `userApi.getUsers({ role: 'owner', limit: 100 })` on every mount with no caching
**File:** `packages/client/src/hooks/useOwnerMapping.ts:30`

Used by `GymsPage`. Every mount fires a fresh request for the owner list. Uses manual state rather than TanStack Query, so there is no deduplication or caching.

**Fix:** Convert to `useQuery` with an appropriate `staleTime`.

---

### P6 — `BenchmarksPage` and `ActivitiesPage` `useEffect` dep arrays list individual search primitives instead of the computed `queryParams` object
**Files:** `packages/client/src/pages/BenchmarksPage.tsx:59-63`; `packages/client/src/pages/ActivitiesPage.tsx:116-127`

```ts
useEffect(() => {
  if (gymId) {
    loadBenchmarkTemplates({ ...queryParams, gymId });
  }
}, [searchQuery, typeFilter, page, pageSize, gymId]);  // queryParams missing
```

`queryParams` (a `useMemo`-computed object) is omitted from the dep array, meaning the effect uses a stale `queryParams` value when only `gymId` changes — the spread will send outdated search/type/page values combined with the new `gymId`.

**Fix:** Replace individual primitives in the dep array with `queryParams`: `}, [queryParams, gymId, loadBenchmarkTemplates])`.

---

## Duplicate / Redundant Code

### D1 — `PaginationData` interface defined identically in 7 different management hooks
**Files:** `useActivityGroupManagement.ts:6-11`; `useActivityTemplateManagement.ts:6-11`; `useCoachManagement.ts:12-17`; `useGymManagement.ts:6-11`; `useUserManagement.ts:6-11`; `useClientManagement.ts:6-11`; `useBenchmarkTemplateManagement.ts:6-11`

All seven files define the same interface:
```ts
interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
```

**Fix:** Export this interface from `@ironlogic4/shared` (or `src/types/pagination.ts`) and import it in all seven hooks.

---

### D2 — The entire management hook pattern (load/create/update/delete + modal state + lastParams) is copy-pasted across 7 hooks — ~1,700 lines of structural boilerplate
**Files:** `useActivityGroupManagement.ts`, `useActivityTemplateManagement.ts`, `useCoachManagement.ts`, `useGymManagement.ts`, `useUserManagement.ts`, `useClientManagement.ts`, `useBenchmarkTemplateManagement.ts`

Each hook has identical structure: same `initialState` shape, same `load*` → `setState(loading)` → API call → `setState(result)` pattern, same `create*/update*/delete*` → close modal → `notifications.show` → `refresh*` pattern, same `openAddModal`, `openEditModal`, `openDeleteModal`, `closeModals` functions. Only the API targets and entity types vary.

**Fix:** Extract a generic `useEntityManagement<T, CreateDto, UpdateDto>` factory hook that accepts API functions and returns the standard shape. Each specific hook becomes a 5-line call to the factory.

---

### D3 — `useActivityGroupSearch`, `useActivityTemplateSearch`, and `useBenchmarkTemplateSearch` share near-identical structure
**Files:** `src/hooks/useActivityGroupSearch.ts`; `src/hooks/useActivityTemplateSearch.ts`; `src/hooks/useBenchmarkTemplateSearch.ts`

All three maintain the same state shape (`searchQuery`, `page`, `pageSize`), use the same debouncing via `useDebouncedValue`, and expose the same outputs (`setSearchQuery`, `setPage`, `setPageSize`, `clearFilters`, `hasFilters`, `queryParams`). `useActivityTemplateSearch` adds `typeFilter` and `groupFilter` as the only variation.

**Fix:** A generic `useSearchState<Params>` base hook parameterized by the query params type would eliminate the shared boilerplate.

---

### D4 — Sub-max input JSX block (rep maxes / time sub-maxes / distance sub-maxes) repeated ~100 lines each across 3 benchmark modals
**Files:** `CreateBenchmarkModal.tsx:239-385`; `EditBenchmarkModal.tsx` (similar range); `CreateNewFromOldModal.tsx` (similar range)

All three modals contain nearly identical JSX trees for rendering `NumberInput` fields for each sub-max type. The only differences are which state setters are called. ~300 lines total that could be ~30.

**Fix:** Extract a `SubMaxInputGrid` component that accepts `fullTemplate`, a values record, and an `onChange` handler.

---

### D5 — `handleCreateBenchmark`, `handleEditBenchmark`, `handleMoveBenchmark`, `handleDeleteBenchmark` all follow the same read-stale-state → mutate-array → `updateClient` pattern
**File:** `packages/client/src/pages/ClientBenchmarksPage.tsx:70-243`

All four handlers read `client.currentBenchmarks` and `client.historicalBenchmarks` from local state, build updated arrays, and call `clientApi.updateClient(...)`. This is an optimistic-patch-on-client-state pattern that does not use the server as the source of truth for benchmark identity (see also B3).

**Fix:** The server should own benchmark CRUD via dedicated endpoints; the client should invalidate and refetch after mutations rather than reconstructing arrays.

---

## Bad Logic / Bugs

### L1 — `tokenRefresh.ts` `isRefreshing` flag and `refreshSubscribers` are module-level globals — not reset on logout
**File:** `packages/client/src/services/tokenRefresh.ts:8-9`

```ts
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];
```

These are module-level variables. When `AuthProvider.logout()` is called, it clears localStorage but these variables remain at whatever state they were in. If a refresh was in progress at the time of logout, `isRefreshing` stays `true` and `refreshSubscribers` retains pending callbacks. The next login's first 401 will find `isRefreshing === true` and enqueue a subscriber that will never be called, causing those requests to hang indefinitely.

**Fix:** Export a `resetRefreshState()` function and call it from `AuthProvider.logout()`, or move the refresh state into a closure tied to the auth session.

---

### L2 — `ScheduleTemplateEditPage` dirty-check uses `JSON.stringify` on arrays — order-sensitive comparison causes false positives
**File:** `packages/client/src/pages/ScheduleTemplateEditPage.tsx:111-126`

```ts
JSON.stringify(coachIds) !== JSON.stringify(template.coachIds) ||
JSON.stringify(days) !== JSON.stringify(template.days.map(...))
```

`JSON.stringify` is order-sensitive. If the server returns `coachIds` in a different order than the client last set them, the dirty check will always return `true` even immediately after saving — leaving the "Save Changes" button enabled and triggering the `beforeunload` "unsaved changes" warning on every navigation.

**Fix:** Sort both arrays before comparing, or use a deep equality library (`fast-deep-equal`) that is order-insensitive for semantically equivalent arrays.

---

### L3 — `ClientBenchmarksPage` captures `activeTab` at modal-open time into a separate `isCurrentBenchmark` boolean — can desync from actual benchmark location
**File:** `packages/client/src/pages/ClientBenchmarksPage.tsx:245-260`

```ts
const openEditModal = (benchmark: ClientBenchmark) => {
  setSelectedBenchmark(benchmark);
  setIsCurrentBenchmark(activeTab === 'current');  // ← snapshot of tab at open time
  setIsEditModalOpen(true);
};
```

`isCurrentBenchmark` and `activeTab` can drift apart, causing `handleEditBenchmark` to modify the wrong array. There is no `isCurrent` flag on the benchmark itself, so the component has two sources of truth for which array a benchmark belongs to.

**Fix:** Derive current/historical membership by checking whether the benchmark's `id` is present in `currentBenchmarks` or `historicalBenchmarks`, rather than from a captured tab value.

---

### L4 — `BenchmarksPage` `useEffect` uses stale `queryParams` — `loadBenchmarkTemplates` and `queryParams` both missing from dep array
**File:** `packages/client/src/pages/BenchmarksPage.tsx:59-63`

```ts
useEffect(() => {
  if (gymId) {
    loadBenchmarkTemplates({ ...queryParams, gymId });
  }
}, [searchQuery, typeFilter, page, pageSize, gymId]);
```

`queryParams` is missing from the dep array. When only `gymId` changes, the spread reads the `queryParams` value from the previous closure — potentially sending outdated search/type/page values with the new gymId. Same pattern exists in `ActivitiesPage:116-127`.

**Fix:** Replace individual primitives in the dep array with `queryParams`: `}, [queryParams, gymId, loadBenchmarkTemplates])`.

---

### L5 — Coach role falls through to "No navigation options available" in `Navigation` despite having accessible routes
**File:** `packages/client/src/components/Navigation.tsx:94-117`

The nav has three branches: `isClient`, `hasFullNavAccess` (admin/owner), and a fallback showing "No navigation options available." `coach` falls into the fallback, but `ClientsPage`, `ClientBenchmarksPage`, and `SchedulesPage` are all accessible to coaches. A coach can reach those pages by direct URL but cannot navigate to them from the sidebar.

**Fix:** Add a `isCoach` branch that shows links to Clients and Schedules.

---

### L6 — `SchedulesPage` `useEffect` calls `loadTemplates` and `loadActiveSchedule` but lists neither in its dep array
**File:** `packages/client/src/pages/SchedulesPage.tsx:89-94`

```ts
useEffect(() => {
  if (gymId) {
    loadTemplates();
    loadActiveSchedule();
  }
}, [gymId]);
```

Both functions are used but not listed as dependencies. Currently both are stable (empty `useCallback` deps), so this is latent rather than actively broken — but it will become a real bug if the hook internals change.

**Fix:** Add `loadTemplates` and `loadActiveSchedule` to the dependency array.

---

## Unused Imports / Dead Code

| Location | Issue |
|---|---|
| `packages/client/src/pages/HomePage.tsx` | Entire file never imported or routed — `App.tsx` has no `/home` route and `"/"` goes directly to `Dashboard` |
| `packages/client/src/services/benchmarkApi.ts:43-51` | `GetBenchmarkProgressResponse` interface defined but never exported; duplicates the inline return type already on `getBenchmarkProgress` |
| `packages/client/src/hooks/useCoaches.ts:5-11` | Local `Coach` interface defined and exported but `CoachResponse` from `@ironlogic4/shared` covers the same shape |
| `packages/client/package.json` | `dayjs` (`^1.11.18`) listed as a dependency but never imported anywhere in `src/` — leftover from `@mantine/dates` era |
| `packages/client/package.json` | `@mantine/dates` (`^8.3.3`) is a major-version mismatch — all other Mantine packages are `^7.x.x`; this may cause duplicate Mantine context providers and style conflicts at runtime |
| `packages/client/src/pages/LoginPage.tsx:177-180` | `onClick` handler logs `'Register clicked'` to console and does nothing — dead placeholder shipped to production |
| `packages/client/src/pages/UsersPage.tsx` | Page-level `<Notification>` banner renders a duplicate success/error message alongside the `notifications.show()` toast already called inside `useUserManagement` — same outcome shown twice |
| `packages/client/src/hooks/useActivityGroupOptions.ts` | Imported only by `ProgramDetailPage`; the type `ActivityGroupOption` is a trivial `{ value: string; label: string }` alias not complex enough to warrant its own hook file |

---

## Test Infrastructure

There are zero test files in `packages/client/src/`. `vitest` is installed and `npm run test` is defined, but the command exits with "no test files found."

**Highest-value areas for test coverage, in priority order:**

1. **`tokenRefresh.ts`** — The module-level mutable `isRefreshing` / `refreshSubscribers` pattern is difficult to reason about under concurrent requests. Unit tests would have caught L1 immediately.

2. **`AuthProvider.tsx` → `AuthGuard.tsx` integration** — The premature redirect before `initializeAuth` completes (B1) is exactly the kind of bug a mount/render test catches on the first run.

3. **`programHelpers.ts`** — Contains 20+ pure functions (`addBlock`, `deleteWeek`, `copyDay`, `convertIdsToMongoose`, etc.) operating on complex nested data structures. Pure, side-effect-free, and the most critical data mutation logic in the app — ideal unit test candidates.

4. **`benchmarkUtils.ts` / `benchmarkFormatters.ts`** — Pure formatting and filtering utilities called across many components. Edge cases (zero `repMaxes`, `null` dates, `BenchmarkType.OTHER`) should all be tested.

5. **Management hooks (`useBenchmarkTemplateManagement.ts` and siblings)** — The identical CRUD + modal-state pattern repeated 7 times means a single integration test suite for the pattern validates all 7 implementations simultaneously.
