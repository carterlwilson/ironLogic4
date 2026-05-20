# Server Audit Report

> Generated 2026-04-26. Covers `packages/server/src/`.

---

## Critical Bug

### B1 — TTL index on `resetTokenExpiry` silently deletes user accounts
**File:** `packages/server/src/models/User.ts:196`

```ts
userSchema.index({ resetTokenExpiry: 1 }, { expireAfterSeconds: 3600 });
```

MongoDB TTL indexes delete the **entire document** when the indexed field expires. Any user who requests a password reset and doesn't complete it within 1 hour will have their account permanently deleted. Token cleanup is already handled in application code (the `resetTokenUsed` flag and expiry check). **Remove this index.**

---

## Security

### S1 — Global rate limiting is disabled
**File:** `packages/server/src/index.ts:51-64`

The global rate limiter is commented out with a TODO. The password-reset route already has the fix (`validate: { trustProxy: false }`). The entire API surface — login, register, all data endpoints — has zero throttling in production.

**Fix:** Apply the same `validate: { trustProxy: false }` workaround to a global limiter and re-enable it.

---

### S2 — `verifyToken` loads the hashed password on every authenticated request
**File:** `packages/server/src/middleware/auth.ts:43`

`.select('+password')` is applied in the auth middleware, attaching the bcrypt hash to `req.user` on every single authenticated request. No controller needs the password there. If anything ever dumps `req.user` in a response, the hash leaks.

**Fix:** Remove `.select('+password')` from `verifyToken`.

---

### S3 — `/ip` debug endpoint exposed with no auth guard
**File:** `packages/server/src/index.ts:102-110`

Returns `req.ip`, `req.ips`, and `X-Forwarded-For` to anyone with the URL. Was added for Railway proxy debugging and never removed.

**Fix:** Gate on `NODE_ENV !== 'production'` or remove entirely.

---

### S4 — `POST /api/auth/register` accepts any `userType` including `owner` and `admin`
**File:** `packages/server/src/routes/auth.ts:11`; `packages/server/src/controllers/auth.ts`

`userType` from the request body is passed directly to `new User(...)`. Any anonymous user can self-register as an owner or admin.

**Fix:** Remove this endpoint (clients are created via invite, coaches via the coaches controller), or force `userType = CLIENT` and add role gating for non-client creation.

---

### S5 — `deleteGym` has no cascade
**File:** `packages/server/src/controllers/gyms.ts:270-295`

Deleting a gym leaves all associated users, programs, templates, and schedules as orphaned documents with dangling `gymId` references.

**Fix:** Add cascade logic in a Mongoose pre-delete hook to clean up or null out dependent resources.

---

### S6 — CORS silently open when `CORS_ORIGIN` env var is unset
**File:** `packages/server/src/index.ts:32-46`

If `CORS_ORIGIN` is not set, `corsOptions` has no `origin` property, which defaults to allowing all origins. An accidentally unset env var in a new deployment opens the API to all origins.

**Fix:** Default to `origin: false` when not configured, and log a startup warning if `CORS_ORIGIN` is unset in production.

---

## Performance

### P1 — Token lookups scan the entire users collection
**Files:** `packages/server/src/controllers/passwordReset.ts`; `packages/server/src/controllers/invite.ts`

All four token-validation flows (reset password, validate reset token, validate invite, accept invite) fetch all users with outstanding tokens, then iterate in application code doing bcrypt comparisons. bcrypt at cost 12 is deliberately slow — this is O(n) DB scan + O(n) bcrypt work.

**Fix:** Store tokens as HMAC-SHA256 (fast, deterministic, indexable) instead of bcrypt hashes, enabling a single `User.findOne({ resetToken: hmac(token) })` lookup.

---

### P2 — Missing index on `refreshTokens.token`
**File:** `packages/server/src/models/User.ts`

`User.findOne({ 'refreshTokens.token': refreshToken })` runs on every token refresh with no index — full collection scan every time.

**Fix:** Add `userSchema.index({ 'refreshTokens.token': 1 })`.

---

### P3 — N+1 query pattern in `ScheduleResetService`
**File:** `packages/server/src/services/ScheduleResetService.ts:42-61`

`ScheduleTemplate.findById` is called inside a loop over all active schedules. With N active schedules this is N+1 queries.

**Fix:** Collect all `templateId` values, bulk-fetch with `ScheduleTemplate.find({ _id: { $in: templateIds } })`, then build a lookup map.

---

### P4 — Program list endpoint returns the entire `blocks` array for every program
**File:** `packages/server/src/controllers/programs.ts:61-68`

The list view receives the full nested `blocks` structure (potentially hundreds of KB) for every program. The list UI almost certainly doesn't need block data.

**Fix:** Add `.select('name description gymId createdBy isActive currentProgress createdAt')` to exclude `blocks` from list queries.

---

### P5 — No pagination on schedule endpoints
**Files:** `packages/server/src/controllers/scheduleTemplates.ts:72`; `packages/server/src/controllers/activeSchedules.ts:64`

Both list endpoints return all matching records without `skip`/`limit`. Unbounded result sets as data grows.

**Fix:** Add standard `page`/`limit` pagination consistent with other list endpoints.

---

## Duplicate / Redundant Code

### D1 — Gym-scoping logic copy-pasted across 10+ controllers
At least `clients.ts`, `coaches.ts`, `programs.ts`, `activityTemplates.ts`, `activityGroups.ts`, `benchmarkTemplates.ts`, `programProgress.ts` all contain nearly identical gym-scoping conditionals. Worse: some use the `UserType` enum, others compare against the raw string `'owner'` — a silent breakage risk if the enum value ever changes.

**Fix:** Extract a `buildGymQuery(user, requestedGymId?)` helper that centralises this logic and always uses the enum.

---

### D2 — `assignProgram` duplicates ~40 lines from `updateClient`
**File:** `packages/server/src/controllers/clients.ts`

Both functions perform the same sequence: look up the program, verify gym ownership, auto-start if not started, save the client.

**Fix:** Extract `assignProgramToClient(client, programId)` as a shared helper called from both places.

---

### D3 — `IdParamSchema` defined locally in two controllers
**Files:** `packages/server/src/controllers/scheduleTemplates.ts:14`; `packages/server/src/controllers/activeSchedules.ts:14`

Both define `z.object({ id: z.string().min(1) })` locally instead of using the shared ObjectId validator. Invalid IDs pass validation and hit MongoDB as cast errors rather than clean 400 responses.

**Fix:** Use the shared ObjectId schema from `@ironlogic4/shared`.

---

### D4 — `resetActiveSchedule` controller and `ScheduleResetService.resetScheduleById` do the same thing differently
**Files:** `packages/server/src/controllers/activeSchedules.ts:336-423`; `packages/server/src/services/ScheduleResetService.ts:105-160`

The controller version preserves existing client assignments; the service version replaces `schedule.days` wholesale. Two divergent implementations of the same operation.

**Fix:** The controller should delegate to the service (or vice versa) — one source of truth.

---

## Bad Logic / Bugs

### L1 — `ScheduleResetService` is never called anywhere
**File:** `packages/server/src/services/ScheduleResetService.ts`

The service is defined and exported but never imported or called. All the reset logic in it is dead at runtime.

**Fix:** Wire it to a scheduled job or remove it.

---

### L2 — `deleteCoach` checks a field that doesn't exist on the User model
**File:** `packages/server/src/controllers/coaches.ts:415-427`

```ts
const assignedClients = await User.findOne({ userType: UserType.CLIENT, assignedCoachId: id });
```

`assignedCoachId` does not exist in the User schema. This query always returns `null` — the "cannot delete coach with assigned clients" guard never fires.

**Fix:** Remove the dead check or implement client-coach assignment properly.

---

### L3 — `validateResetToken` computes a bcrypt hash it never uses
**File:** `packages/server/src/controllers/passwordReset.ts:206-207`

```ts
const hashedToken = await hashResetToken(token); // result is never referenced
```

Unnecessary bcrypt work on every validate-token call.

**Fix:** Remove the dead `hashResetToken` call.

---

### L4 — `updateUser` calls `.toJSON()` on an already-plain object
**File:** `packages/server/src/controllers/users.ts:238`

`updatedUser` is assigned the result of `existingUser.toJSON()` (a plain object), then `.toJSON()` is called on it again. Plain objects don't have a `.toJSON()` method.

**Fix:** Use `data: updatedUser` directly.

---

### L5 — `Program.transformIds` uses the wrong ObjectId class name
**File:** `packages/server/src/models/Program.ts:~600`

```ts
obj.constructor.name === 'ObjectID'  // Mongoose 5 name
```

In Mongoose 6+, the class is `ObjectId` (no trailing `D`). This branch never matches — IDs in nested program structures may not be transformed correctly in API responses.

**Fix:** Replace with `obj instanceof mongoose.Types.ObjectId`.

---

### L6 — `leaveTimeslot` is not atomic
**File:** `packages/server/src/controllers/clientSchedules.ts:418-428`

Uses in-memory `splice()` then `schedule.save()`. Concurrent requests can interleave and one user's leave can overwrite another's join. The corresponding `joinTimeslot` correctly uses `findOneAndUpdate`.

**Fix:** Rewrite using an atomic `$pull` operation.

---

### L7 — `joinTimeslot` capacity check is not included in the atomic update
**File:** `packages/server/src/controllers/clientSchedules.ts:260-304`

Capacity is read in one query, then the atomic `findOneAndUpdate` does not re-check it. A timeslot can exceed capacity under concurrent joins.

**Fix:** Include the capacity constraint in the update query filter, or use a transaction.

---

### L8 — `createMyBenchmark` and `updateMyBenchmark` skip Zod validation
**File:** `packages/server/src/controllers/clientBenchmarks.ts:77, 210`

Every other controller validates with `safeParse`. These two cast `req.body` directly to a TypeScript type. Invalid input produces runtime errors or silent misbehavior instead of clean 400 responses.

**Fix:** Add `Schema.safeParse(req.body)` guards.

---

### L9 — Five `console.log` calls in the login controller
**File:** `packages/server/src/controllers/auth.ts:88-125`

Logs user lookup details and password comparison results to stdout in production.

**Fix:** Remove or gate on `NODE_ENV !== 'production'`.

---

### L10 — `generateRandomPassword` uses `Math.random()`
**File:** `packages/server/src/utils/auth.ts:40-48`

Not cryptographically secure. Used for temporary passwords and invite credentials.

**Fix:** Replace with `crypto.randomBytes`-based character selection.

---

### L11 — `getRefreshTokenExpiry` silently produces `Invalid Date` for non-`d` suffixes
**File:** `packages/server/src/utils/auth.ts:61-66`

Only parses `90d` format. Any other value (e.g., `'90'`, `'3m'`) stores an invalid expiry date in the database with no error.

**Fix:** Validate the parsed value; fall back to the default and log a warning if it's `NaN` or <= 0.

---

## Unused Imports / Dead Code

| Location | Issue |
|---|---|
| `index.ts` | `import rateLimit from 'express-rate-limit'` — usage is commented out |
| `routes/gym/activityTemplates.ts` | `AuthenticatedRequest` imported but unused |
| `routes/gym/activityGroups.ts` | `AuthenticatedRequest` imported but unused |
| `controllers/activityTemplates.ts` | `ActivityTemplateListParams` imported but unused |
| `controllers/activityGroups.ts` | `ActivityGroupListParams` imported but unused |
| `scripts/addClients.ts` | Hardcoded production gym ID and `DEFAULT_PASSWORD = 'password123'` still in `package.json` scripts |
| `scripts/syncProdData.ts` | Same — one-time migration left as a runnable script |

---

## Test Infrastructure

`jest`, `ts-jest`, and `@types/jest` are installed as dev dependencies but there are zero test files in the server package. These take up install time for no benefit. Consider removing until tests are written, or switching to `vitest` for consistency with the client package.
