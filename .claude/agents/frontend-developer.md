---
name: frontend-developer
description: Use this agent when working on the client application (packages/client), implementing React components, pages, hooks, services, routing, Mantine v7 styling, Vite config, or React Query. Examples: <example>user: 'I need to add a new page to the client app' assistant: 'I'll use the frontend-developer agent.'</example> <example>user: 'The client build is failing with TypeScript errors' assistant: 'Let me use the frontend-developer agent to investigate.'</example> <example>user: 'Create a hook to fetch coach data' assistant: 'I'll use the frontend-developer agent.'</example> Do NOT use for packages/mobile (use mobile-developer) or pure visual design critique (use ui-design-specialist).
model: sonnet
---

You work exclusively in `packages/client`. Before writing any code that uses a third-party library, use context7 to verify the current API docs for that library.

**For exploration, scoping, or answering questions:** handle directly by reading the codebase.

**For writing components, pages, hooks, or services:** spawn the `client-impl` agent with a clear description of the task, relevant file paths you've already identified, and any constraints.

**Before spawning client-impl:** read the relevant existing files so you can brief the implementation agent accurately. Do not ask client-impl to explore — give it a specific task.

Build verification: `npm run build -w packages/client`

---

## Architecture Overview

Desktop-focused React SPA (185 TypeScript/TSX files, ~25k lines). Role-based admin/management tool for gym coaches and owners. Clients (role=`client`) are redirected to the mobile PWA at login time.

**State management:** React Query (TanStack Query v5) for server state + React Context for auth + custom hooks for UI/CRUD state. No Redux or Zustand.

---

## Directory Structure

```
packages/client/src/
├── components/              # 113 files, feature-organized
│   ├── admin/
│   │   ├── ActivityManagement/  # 14 files
│   │   ├── CoachManagement/     # 12 files
│   │   ├── GymManagement/       # 7 files
│   │   └── UserManagement/      # 6 files
│   ├── benchmarks/          # 14 files
│   ├── clientBenchmarks/    # 9 files
│   ├── clients/             # 7 files
│   ├── Programs/
│   │   ├── Detail/
│   │   └── List/
│   ├── schedules/
│   │   ├── ActiveTab/
│   │   ├── TemplateTab/
│   │   ├── TemplateEdit/
│   │   └── shared/
│   ├── AuthGuard.tsx        # 24 lines — protected route wrapper
│   └── Navigation.tsx       # 236 lines — role-based sidebar
├── pages/                   # 17 route pages
├── hooks/                   # 30 custom hooks (~4k lines)
├── services/                # 13 API service files (~1.7k lines)
├── providers/
│   └── AuthProvider.tsx     # 236 lines — global auth context
├── utils/                   # 7 utility files
├── theme/
│   └── theme.ts             # 103 lines — Mantine theme config
├── styles/                  # Global CSS (1 file)
├── App.tsx                  # 82 lines — routes + AppShell layout
└── main.tsx                 # 36 lines — entry point, providers
```

---

## Routing

Framework: React Router v6.

```
Public routes:
  /login, /forgot-password, /reset-password

Protected routes (AuthGuard):
  /  or  /dashboard           → Dashboard
  /users                      → UsersPage          (admin only)
  /gyms                       → GymsPage           (admin only)
  /activities                 → ActivitiesPage
  /benchmarks                 → BenchmarksPage
  /coaches                    → CoachesPage
  /clients                    → ClientsPage
  /clients/:clientId/benchmarks → ClientBenchmarksPage
  /my-benchmarks              → MyBenchmarksPage   (client role)
  /programs                   → ProgramListPage
  /programs/:programId        → ProgramDetailPage
  /schedules                  → SchedulesPage
  /schedules/templates/:templateId/edit → ScheduleTemplateEditPage
```

**Layout** (`App.tsx`): Mantine `AppShell` — fixed 60px header, collapsible 280px sidebar (`Navigation.tsx`), main content area.

**AuthGuard** (`src/components/AuthGuard.tsx`, 24 lines): shows `LoadingOverlay` during init, redirects to `/login` if not authenticated.

**Role-based redirects in pages**: pages that require a specific role call `<Navigate to="/dashboard" replace />` if the user's role doesn't qualify (e.g., ClientsPage checks for `owner` or `coach`).

---

## Authentication

**AuthProvider** (`src/providers/AuthProvider.tsx`, 236 lines):
- Context: `user`, `tokens`, `isAuthenticated`, `isLoading`, `error`
- Methods: `login()`, `logout()`, `clearError()`, `initializeAuth()`
- Storage: `localStorage.authTokens` (JSON) and `localStorage.user` (JSON)

**User roles**: `'admin' | 'owner' | 'coach' | 'client'`

| Role | Access |
|------|--------|
| admin | All features across all gyms |
| owner | Single-gym management (activities, benchmarks, coaches, clients, programs, schedules) |
| coach | Client management, programs, schedules |
| client | `/my-benchmarks` only — redirected to mobile PWA |

**Mobile redirect** (`src/utils/redirectToMobile.ts`, 28 lines):
- `shouldRedirectToMobile(user)` returns true if `role === 'client'`
- `redirectToMobileApp(tokens, user)` base64-encodes auth data into URL hash: `${VITE_MOBILE_APP_URL}#auth=<base64>`
- Called on login and app initialization

**Token refresh** (`src/services/tokenRefresh.ts`, 133 lines):
- `authenticatedRequest<T>()` — all authenticated API calls go through this
- Auto-refreshes on 401; uses `isRefreshing` flag + subscriber queue to deduplicate concurrent refresh attempts
- On refresh failure: clears localStorage, redirects via `window.location.href = '/login'`

**Auth endpoints**: `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`

---

## API Service Pattern

Base URL: `import.meta.env.VITE_API_URL || 'http://localhost:3001'`

Each domain has its own service class with a singleton export:

```typescript
class ClientApiService {
  async getClients(params): Promise<PaginatedResponse<User>> { ... }
  async createClient(data): Promise<CreateClientResponse> { ... }
  async updateClient(id, data): Promise<ApiResponse<User>> { ... }
  async deleteClient(id): Promise<ApiResponse> { ... }
}
export const clientApi = new ClientApiService();
```

All methods call `authenticatedRequest<T>()` from `tokenRefresh.ts`. Shared types imported from `@ironlogic4/shared`.

**Service files:**

| File | Lines | Domain |
|------|-------|--------|
| tokenRefresh.ts | 133 | Base authenticated request + token refresh |
| clientApi.ts | 157 | Clients + program assignment |
| coachApi.ts | 149 | Coaches |
| userApi.ts | 160 | Users (admin) |
| gymApi.ts | 58 | Gyms (admin) |
| programApi.ts | 96 | Programs + structure updates |
| scheduleApi.ts | 407 | Schedule templates + active schedules |
| benchmarkApi.ts | 227 | Benchmark templates + client benchmarks + progress |
| activityTemplateApi.ts | 60 | Activity templates |
| activityGroupApi.ts | 69 | Activity groups |

---

## State Management Patterns

### React Query (primary for server state)

Configured in `main.tsx`: `refetchOnWindowFocus: false`, `retry: 1`.

Query keys follow a factory pattern:
```typescript
export const programKeys = {
  all: ['programs'] as const,
  lists: () => [...programKeys.all, 'list'] as const,
  list: (params) => [...programKeys.lists(), params] as const,
  detail: (id) => [...programKeys.all, 'detail', id] as const,
};
```

Hooks that use React Query (`src/hooks/usePrograms.ts`, etc.) export named hooks per operation:
```typescript
export const useProgramList = (params) => useQuery({ queryKey: programKeys.list(params), queryFn: () => programApi.getPrograms(params) });
export const useCreateProgram = () => useMutation({ mutationFn: programApi.createProgram, onSuccess: () => queryClient.invalidateQueries(...) });
```

### CRUD Management Hooks (for non-React Query domains)

Management hooks co-locate data + loading state + modal state + CRUD callbacks:
```typescript
export const useClientManagement = () => {
  const [state, setState] = useState<UseClientManagementState>(initialState);
  const loadClients = useCallback(async (params) => { ... }, []);
  const createClient = useCallback(async (data) => { ... }, []);
  const openAddModal = () => setState(s => ({ ...s, isAddModalOpen: true }));
  const closeModals = () => setState(s => ({ ...s, isAddModalOpen: false, selectedItem: null }));
  return { ...state, loadClients, createClient, openAddModal, closeModals };
};
```

Files: `useClientManagement.ts` (230), `useCoachManagement.ts` (335), `useUserManagement.ts` (270), `useGymManagement.ts` (242), `useScheduleTemplates.ts` (222), `useActiveSchedule.ts` (260), `useMyBenchmarks.ts` (247), `useBenchmarkTemplateManagement.ts` (242).

### Component-level state

- `useState` for modal open/close flags and selected item
- `useMemo` for expensive lookups (e.g., `programNameMap` in ClientsPage)
- `useCallback` for stable event handler references

---

## Component Patterns

**Feature-based naming conventions:**

| Pattern | Example |
|---------|---------|
| Modal | `AddClientModal.tsx`, `DeleteBenchmarkTemplateModal.tsx` |
| Table | `ClientTable.tsx`, `GymTable.tsx` |
| Row | `ClientRow.tsx`, `BenchmarkTemplateRow.tsx` |
| Toolbar | `ClientToolbar.tsx` — search/filter controls |
| EmptyState | `ClientEmptyState.tsx` — null state UI |
| Badge | `ActivityTypeBadge.tsx`, `UserBadge.tsx` |

**Modal pattern**: `isOpen` + `onClose` + data + callbacks as props. Form via `@mantine/form`. Submit shows `notifications.show()` on success/error, resets form on success.

**Page pattern**: page calls the management hook, passes state/callbacks to child components. Role check at top of page returns `<Navigate>` if unauthorized.

**Pagination/search pattern**:
```typescript
const [params, setParams] = useState({ page: 1, limit: 10, search: '' });
const handleSearch = (search) => setParams(prev => ({ ...prev, search, page: 1 }));
```

**Auto-save pattern** (ProgramDetailPage): mutations with `onSuccess` notifications suppressed to avoid spam; errors still shown.

---

## Forms

Library: `@mantine/form` v7.

```typescript
const form = useForm<FormValues>({
  initialValues: { email: '', password: '' },
  validate: {
    email: (v) => !v ? 'Required' : !/^\S+@\S+\.\S+$/.test(v) ? 'Invalid email' : null,
    password: (v) => !v ? 'Required' : v.length < 6 ? 'Min 6 chars' : null,
  },
});
// Binding: <TextInput {...form.getInputProps('email')} />
// Submit: <form onSubmit={form.onSubmit(handleSubmit)}>
```

Date inputs via `@mantine/dates`. Password generation utility at `src/utils/passwordGenerator.ts`.

---

## Styling

**Mantine v7 only.** Icons from `@tabler/icons-react` v2.40.0.

**Theme** (`src/theme/theme.ts`, 103 lines) — identical palette to mobile:
- Primary: `forestGreen` — `#3d9f5e` at shade 6
- Secondary: `lightGray` — 10-shade palette
- Spacing: xs=8px, sm=12px, md=16px, lg=24px, xl=32px
- Radius: xs=4px, sm=6px, md=8px, lg=12px, xl=16px
- Component overrides: Button fontWeight 500 + transition, TextInput/PasswordInput green focus, Paper 12px radius + 1px border

**Styling methods** (in priority order):
1. Mantine component props: `<Button color="forestGreen" variant="light" size="md" />`
2. `style={{}}` for dynamic/layout needs
3. `color="var(--mantine-color-forestGreen-6)"` for CSS variable references

**PostCSS**: `postcss-preset-mantine` + `postcss-simple-vars`. Global CSS in `src/styles/`.

---

## Key Pages

| Page | Route | Lines | Notes |
|------|-------|-------|-------|
| LoginPage | /login | 203 | Mantine form, role-based redirect post-login |
| ForgotPasswordPage | /forgot-password | 197 | Email submission only |
| ResetPasswordPage | /reset-password | 352 | Token-based reset |
| Dashboard | / | 109 | Role info, nav shortcuts |
| UsersPage | /users | 179 | Admin user management |
| GymsPage | /gyms | 184 | Admin gym management |
| ActivitiesPage | /activities | 294 | Dual-tab: templates + groups |
| BenchmarksPage | /benchmarks | 139 | Benchmark template CRUD |
| CoachesPage | /coaches | 193 | Coach management |
| ClientsPage | /clients | 150 | Client roster |
| ClientBenchmarksPage | /clients/:id/benchmarks | 399 | Most complex — tabs, date filtering, history |
| MyBenchmarksPage | /my-benchmarks | 243 | Client self-view |
| ProgramListPage | /programs | 99 | Search + paginated list |
| ProgramDetailPage | /programs/:id | 214 | Block/week/day editor, auto-save |
| SchedulesPage | /schedules | 242 | Template + active schedule tabs |
| ScheduleTemplateEditPage | /schedules/templates/:id/edit | 327 | Template editor |

---

## Key Conventions

- **Shared types** from `@ironlogic4/shared` — never redefine types that exist there.
- **Date normalization**: API date strings converted to `Date` objects in service layer.
- **No test files exist** — Vitest is configured but unused.
- **TypeScript strict mode** — no unused vars/params.
- **Env vars**: `VITE_API_URL` (default `http://localhost:3001`), `VITE_MOBILE_APP_URL` (default `http://localhost:3002`).
- **No AbortController / request cancellation**, no request timeout handling.
- **Error boundaries**: none — errors caught in try/catch, shown via `notifications.show()`.
- Port: `3000` in dev (proxies `/api/*` to `3001`).
