---
name: server-developer
description: Use this agent when working on the server application (packages/server): Express routes, controllers, Mongoose models, auth middleware, Zod validation, or API design. Examples: <example>user: 'Add an endpoint to fetch all clients for a gym' assistant: 'I'll use the server-developer agent.'</example> <example>user: 'The server is returning a 500 on the programs route' assistant: 'Let me use the server-developer agent to investigate.'</example> <example>user: 'Update the User model to add a new field' assistant: 'I'll use the server-developer agent.'</example> Do NOT use for client or mobile frontend work.
model: sonnet
---

You work exclusively in `packages/server`. Before writing any code that uses a third-party library, use context7 to verify the current API docs for that library.

**For exploration, scoping, or answering questions:** handle directly by reading the codebase.

**For writing routes, controllers, models, or middleware:** spawn the `server-impl` agent with a clear description of the task, the relevant route scope (auth/admin/owner/gym/me/coach), files you've already identified, and any auth/role constraints.

**Before spawning server-impl:** read the relevant existing files so you can brief the implementation agent accurately. Do not ask server-impl to explore — give it a specific task.

Build verification: `npm run build -w packages/server`

---

## Architecture Overview

Express.js + TypeScript API with MongoDB/Mongoose. 54 TypeScript files. Runs on port 3001.

**Layer structure:** Routes → Middleware → Controllers → Models/Services. Validation (Zod) at the top of every controller, before any DB work.

---

## Directory Structure

```
packages/server/src/
├── controllers/     # 18 files — one file per resource, async arrow functions
├── middleware/
│   ├── auth.ts      # 281 lines — verifyToken + all role/gym middleware
│   └── requireClient.ts  # 31 lines — CLIENT-only guard
├── models/          # 9 Mongoose models
├── routes/
│   ├── auth.ts
│   ├── passwordReset.ts
│   ├── invite.ts
│   ├── admin/       # users.ts, gyms.ts
│   ├── gym/         # activity-templates, activity-groups, clients, coaches,
│   │                #   benchmark-templates, programs, schedules
│   └── me/          # benchmarks, workouts
├── services/
│   ├── ScheduleResetService.ts
│   └── activityGroupCleanup.ts
├── utils/
│   ├── auth.ts          # generateToken, generateRefreshToken, hashPassword
│   ├── emailService.ts  # SendGrid integration
│   └── tokenGenerator.ts
└── index.ts         # 192 lines — app init, middleware stack, route registration
```

---

## Express App Setup

Entry point: `src/index.ts`.

**Middleware stack (in order):**
1. `helmet()` — security headers
2. `cors(corsOptions)` — origins from `CORS_ORIGIN` env var (comma-separated)
3. Request logger — `console.log([REQUEST] method path ip)`
4. `express.json({ limit: '10mb' })`
5. `express.urlencoded({ extended: true })`

`trust proxy = 1` for Railway reverse proxy. Rate limiting is currently **disabled** (TODO comment — was causing SIGTERM issues).

**Route registration:**
```
/api/auth                   auth.ts + passwordReset.ts + invite.ts
/api/admin/users            admin/users.ts
/api/admin/gyms             admin/gyms.ts
/api/gym/activity-templates
/api/gym/activity-groups
/api/gym/clients
/api/gym/coaches
/api/gym/benchmark-templates
/api/gym/programs
/api/gym/schedules
/api/me                     me/ (benchmarks, workouts)
```

**Health endpoints:** `GET /` → `'OK'`, `GET /health` → `{ success: true }`, `GET /ip` → proxy debug info.

---

## Route Organization

URL pattern: `/api/{scope}/{resource}`

Each route file is an Express `Router`. Middleware chain is specified inline per route:
```typescript
router.get('/', verifyToken, requireGymStaffAccess, controller);
router.post('/', verifyToken, requireGymStaffAccess, requireAdminOrOwner, controller);
```

Nested routers mounted via `Router.use()` for sub-resources (e.g., `/programs/:id/progress`).

---

## Controller Pattern

All controllers are **async arrow functions** exported by name:
```typescript
export const createProgram = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  // 1. Validate with Zod (return early on failure)
  // 2. Authorize (check gym scoping, ownership)
  // 3. DB operation
  // 4. Return response
};
```

**Standard success response:**
```typescript
res.status(201).json({ success: true, data: result, message: 'Created successfully' });
```

**Standard error response:**
```typescript
res.status(400).json({ success: false, error: 'Validation failed', details: validation.error.errors });
```

**Paginated response:**
```typescript
res.json({
  success: true,
  data: results,
  pagination: { page, limit, total, totalPages }
});
```

**Gym scoping pattern** (used across programs, clients, coaches, benchmarks, schedules):
```typescript
const query: any = {};
if (req.user?.userType === 'owner') {
  query.gymId = req.user.gymId;   // owners see only their gym
} else if (gymIdParam) {
  query.gymId = gymIdParam;        // admins can filter by gymId
}
```

**Pagination pattern:**
```typescript
const skip = (page - 1) * limit;
const [results, total] = await Promise.all([
  Model.find(query).skip(skip).limit(limit),
  Model.countDocuments(query)
]);
```

**Duplicate key handling:**
```typescript
if (error instanceof Error && 'code' in error && (error as any).code === 11000) {
  res.status(409).json({ success: false, error: 'Already exists', message: '...' });
}
```

---

## Mongoose Models

**9 models total.** All apply a `toJSON` transform converting `_id` → `id` and excluding sensitive fields.

### User (`models/User.ts`, 198 lines)
Key fields: `email` (unique), `firstName`, `lastName`, `userType`, `password` (hashed, `select: false`), `gymId`, `programId`, `status` (`'invited' | 'active'`).

Token fields: `resetToken`, `resetTokenExpiry`, `inviteToken`, `inviteTokenExpiry`, `refreshTokens[]` (`{ token, createdAt, expiresAt }`).

Benchmark fields (subdocuments embedded directly on User): `currentBenchmarks[]`, `historicalBenchmarks[]` — both use the `ClientBenchmark` subdocument schema.

Indexes: `email` (unique), `(gymId, userType)` compound, `programId`, `resetTokenExpiry` (TTL).

Instance method: `comparePassword(candidate)` — bcrypt comparison.

Pre-save hook: hashes password on change.

### Gym (`models/Gym.ts`, 63 lines)
Fields: `name`, `address`, `phoneNumber`, `ownerId` (ref: User).
Pre-save: validates `ownerId` references an existing User.

### Program (`models/Program.ts`, 663 lines) — most complex model
Hierarchical: **Program → Blocks → Weeks → Days → Activities → Sets**

Key nested schemas:
- `ISet`: `reps`, `percentageOfMax`, `templateRepMaxId?`
- `IActivity`: `activityTemplateId`, `type`, `order`, `sets[]`, cardio fields (`cardioType`, `time`, `distance`, `repetitions`)
- `IDay`: `name`, `order`, `activities[]`
- `IWeek`: `name`, `order`, `activityGroupTargets[]`, `days[]`
- `IBlock`: `name`, `order`, `activityGroupTargets[]`, `weeks[]`
- `IProgramProgress`: `blockIndex`, `weekIndex`, `startedAt`, `completedAt`, `lastAdvancedAt`, `totalWeeksCompleted`

Pre-validate hook: lift activities must have sets; cardio activities must not.
Pre-delete hook: unassigns program from all users (`User.updateMany`).

### BenchmarkTemplate (`models/BenchmarkTemplate.ts`, 175 lines)
Fields: `name`, `notes`, `type` (`WEIGHT | DISTANCE | TIME`), `tags[]`, `gymId`, `createdBy`.

Type-specific subdocs:
- WEIGHT: `templateRepMaxes[]` (reps, name)
- DISTANCE: `templateTimeSubMaxes[]`, `distanceUnit`, `templateDistanceSubMaxes[]`
- TIME: `templateDistanceSubMaxes[]`, `distanceUnit`, `templateTimeSubMaxes[]`

Pre-save: validates correct subdocs present per type.

### ActivityTemplate (`models/ActivityTemplate.ts`, 61 lines)
Fields: `name`, `notes`, `groupId`, `type` (ActivityType enum), `gymId`, `createdBy`.
Text index on `name + notes`.

### ActivityGroup (`models/ActivityGroup.ts`, 48 lines)
Fields: `name`, `notes`, `gymId`, `createdBy`.
Text index. Used to categorize activity templates.

### ScheduleTemplate (`models/ScheduleTemplate.ts`, 149 lines)
Fields: `gymId`, `name`, `description`, `coachIds[]`, `createdBy`.
Nested: `days[]` → `timeSlots[]` (`startTime`, `endTime` HH:MM, `capacity`, `assignedClients[]`).
Unique compound index: `(gymId, name)`.

### ClientBenchmark
Subdocument schema embedded in `User.currentBenchmarks` and `User.historicalBenchmarks` — not a standalone collection.
Type-specific measurement arrays:
- WEIGHT: `repMaxes[]` (`templateRepMaxId`, `weightKg`, `recordedAt`)
- DISTANCE: `timeSubMaxes[]` (`templateSubMaxId`, `distanceMeters`, `recordedAt`)
- TIME: `distanceSubMaxes[]` (`templateDistanceSubMaxId`, `timeSeconds`, `recordedAt`)

### ActiveSchedule (`models/ActiveSchedule.ts`)
Fields: `gymId`, `templateId`, `days[]`, `coachIds[]`, `lastResetAt`.
Represents a live schedule instance derived from a ScheduleTemplate.

---

## Authentication & Authorization

**JWT access tokens**: `generateToken(userId)` — signed with `JWT_SECRET`, default expiry 30min (`JWT_EXPIRES_IN`).

**Refresh tokens**: `generateRefreshToken()` — 64-byte random hex, stored in `User.refreshTokens[]` with expiry. Default 90 days (`JWT_REFRESH_EXPIRES_IN`). Max 5 per user (oldest pruned). Rotated on each refresh.

**Password hashing**: bcrypt, 12 salt rounds.

### Middleware (`middleware/auth.ts`, 281 lines)

| Middleware | Purpose |
|---|---|
| `verifyToken` | Validates Bearer JWT, fetches user, attaches to `req.user` |
| `requireRole(roles[])` | Factory — checks `req.user.userType` is in allowed list |
| `requireAdmin` | Admin only |
| `requireAdminOrOwner` | Admin or Owner |
| `requireAdminOrCoach` | Admin, Owner, or Coach |
| `requireGymStaffAccess` | Admin, Owner, or Coach (with gymId for non-admins) |
| `requireOwnerOrAdminForGym` | Owner (own gym) or Admin |
| `requireUserManagementPermission` | Hierarchical: Admin > Owner > Coach > Client |
| `requireClient` | CLIENT role only (`middleware/requireClient.ts`) |

**Role hierarchy**: `admin > owner > coach > client`

**`AuthenticatedRequest`**: extends `Request` with `user?: UserDocument`.

---

## Validation Pattern

Zod schemas defined in `@ironlogic4/shared`. Used at the top of every controller before any DB work:

```typescript
const validation = CreateProgramSchema.safeParse(req.body);
if (!validation.success) {
  res.status(400).json({ success: false, error: 'Validation failed', details: validation.error.errors });
  return;
}
const { name, description, gymId } = validation.data; // fully typed
```

Same pattern for `req.query` (list params) and `req.params` (IDs — validated as 24-char hex ObjectId).

Common shared validators: `z.string().regex(/^[0-9a-fA-F]{24}$/)` for ObjectIds. Pagination: `page` (min 1), `limit` (min 1, max 100, default 10).

---

## Error Handling

No custom error classes. Errors handled inline in controllers with try-catch.

| Status | Scenario |
|--------|----------|
| 400 | Validation failure (Zod) |
| 401 | Missing/invalid/expired token; invalid credentials |
| 403 | Insufficient role; owner accessing another gym |
| 404 | Resource not found |
| 409 | MongoDB duplicate key (code 11000) |
| 500 | Unexpected error — logged to console |

Process-level handlers in `index.ts`: `unhandledRejection` (logs), `uncaughtException` (logs + exits).

---

## Environment Variables

```
PORT=3001
MONGODB_URI=mongodb://localhost:27017/ironlogic4
JWT_SECRET=                     # required — throws on startup if missing
JWT_EXPIRES_IN=30m
JWT_REFRESH_EXPIRES_IN=90d
NODE_ENV=development
SENDGRID_API_KEY=
SENDGRID_VERIFIED_SENDER=
CLIENT_URL=http://localhost:3000
MOBILE_APP_URL=http://localhost:3002
CORS_ORIGIN=http://localhost:3000,http://localhost:3002
```

---

## API Conventions

- **URL pattern**: `/api/{scope}/{resource}[/:id][/sub-resource]`
- **Scopes**: `auth`, `admin`, `gym`, `me`
- All success responses: `{ success: true, data: ..., message?: ... }`
- All error responses: `{ success: false, error: string, message?: string, details?: ZodIssue[] }`
- Paginated responses include `pagination: { page, limit, total, totalPages }`
- Common query params: `?page=1&limit=10&search=&gymId=`
- IDs in responses: always `id` (string), never `_id` — applied via `toJSON` transform on all models

---

## Notable Patterns

**Shared types from `@ironlogic4/shared`**: All Zod schemas and TypeScript interfaces live there. Never redefine them in the server.

**Subdocument-heavy design**: ClientBenchmark is embedded in User (not a separate collection). Program structure (blocks/weeks/days/activities) is fully nested — no separate collections for those.

**Cascade via pre-delete hooks**: Program deletion triggers `User.updateMany` to unassign the program from all users.

**Email service** (`utils/emailService.ts`): SendGrid, lazy-initialized. Sends HTML + plaintext for password reset and invite flows. Tokens embedded in `CLIENT_URL` or `MOBILE_APP_URL` links.

**Services** (`services/`): `ScheduleResetService` handles bulk schedule operations. `activityGroupCleanup` handles orphan cleanup. Business logic that spans multiple models lives here, not in controllers.

**No test files exist** — TypeScript strict mode enforced throughout.
