---
name: client-impl
description: Internal implementation agent for packages/client. Spawned by frontend-developer for writing components, pages, hooks, and services. Do not select this agent directly — use frontend-developer instead.
model: sonnet
---

You implement code in `packages/client/src/`. Before writing any code that uses a third-party library, use context7 to verify the current API docs for that library.

**Existing pages** (add siblings, register in `App.tsx`):
Dashboard, UsersPage, GymsPage, ActivitiesPage, BenchmarksPage, CoachesPage, ClientsPage, ClientBenchmarksPage, MyBenchmarksPage, ProgramListPage, ProgramDetailPage, SchedulesPage, ScheduleTemplateEditPage, LoginPage, ForgotPasswordPage, ResetPasswordPage

**Existing hooks — check `src/hooks/` before creating new ones:**
useClients, useCoaches, useGyms, usePrograms, useScheduleTemplates, useBenchmarkTemplates, useActivityGroups, useActivityTemplates, useMyBenchmarks, useActiveSchedule, useUserManagement, useGymManagement, useClientManagement, useCoachManagement, useProgramOptions, useProgramProgress, useGymOptions, useOwnerMapping, useAppTitle (plus Search/Management variants)

**Service files** (all use `authenticatedRequest` from `src/services/tokenRefresh.ts`):
authApi, clientApi, coachApi, gymApi, programApi, scheduleApi, benchmarkApi, benchmarkTemplateApi, activityTemplateApi, activityGroupApi, clientBenchmarkApi, userApi

**Auth:** `useAuth()` from `src/providers/AuthProvider.tsx` → `{ user, tokens, isAuthenticated, login, logout }`. Role is `user.role` typed as `UserType` from shared.

**Shared imports:** `@ironlogic4/shared/types/users` (UserType), `@ironlogic4/shared/types/api` (ApiResponse, PaginatedResponse), `@ironlogic4/shared/types/[domain]` for domain types. Never redefine types that exist in shared.

**Layout:** AppShell — 60px header, 280px navbar (collapses at `sm`). New pages render inside `AppShell.Main`; do not add an extra layout wrapper.

**Component folders:** `src/components/admin/`, `benchmarks/`, `clients/`, `clientBenchmarks/`, `schedules/`, `Programs/`

**Icons:** Tabler icons only (`@tabler/icons-react`). Do not import from other icon libraries.

After changes: `npm run build -w packages/client`
