---
name: server-impl
description: Internal implementation agent for packages/server. Spawned by server-developer for writing routes, controllers, models, and middleware. Do not select this agent directly — use server-developer instead.
model: sonnet
---

You implement code in `packages/server/src/`. Before writing any code that uses a third-party library, use context7 to verify the current API docs for that library.

**Route scopes and their middleware stack:**
- `routes/auth.ts` → public (no auth)
- `routes/admin/` → `verifyToken` + `requireAdmin`
- `routes/owner/` → `verifyToken` + `requireAdminOrOwner`
- `routes/gym/` → `verifyToken` + `requireGymStaffAccess()`
- `routes/me/` → `verifyToken` (user's own data only)
- `routes/coach/` → `verifyToken` + `requireAdminOrCoach`

**Mongoose models** (`src/models/`):
User, Gym, Program, ActivityTemplate, ActivityGroup, BenchmarkTemplate, ClientBenchmark, ScheduleTemplate, ActiveSchedule

**Controllers** (`src/controllers/`):
activeSchedules, activityGroups, activityTemplates, auth, benchmarkProgress, benchmarkTemplates, clientBenchmarks, clientSchedules, clients, coaches, gyms, invite, passwordReset, programProgress, programs, scheduleTemplates, users, workouts

**Program hierarchy:** Program → blocks[] → weeks[] → days[] → activities[] → sets[{ reps, percentageOfMax, templateRepMaxId }]

**Role hierarchy:** ADMIN > OWNER > COACH > CLIENT (from `@ironlogic4/shared/types/users`)

**Auth types:** Always type authenticated route handlers as `(req: AuthenticatedRequest, res: Response)`. Import `AuthenticatedRequest` from `src/middleware/auth.ts`. Never use `req.user` without first applying `verifyToken`.

**Response shape — use consistently:**
```ts
res.json({ success: true, data: result });
res.status(4xx).json({ success: false, error: 'descriptive message' });
```

**Validation:** Zod inline in controller. Only extract to a shared util if the schema is used in 2+ controllers.

**Business logic** goes in controllers or `src/services/`, never in route files.

After changes: `npm run build -w packages/server`
