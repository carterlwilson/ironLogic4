# Scheduling Feature Implementation Plan

## Overview
Class scheduling system supporting a gym with coaches and clients. Clients have default weekly slots that auto-enroll each week, with the ability to make one-off changes. Coaches can view rosters, mark attendance, and browse by day or week.

---

## Data Models (MongoDB / Mongoose)

### `ScheduleTemplate`
Defines the gym's recurring weekly class offerings. One document per recurring class slot.

```typescript
{
  _id: ObjectId,
  gymId: ObjectId,           // ref: Gym
  coachId: ObjectId,         // ref: User (role: coach)
  dayOfWeek: number,         // 0=Sunday, 1=Monday, ..., 6=Saturday
  period: 'AM' | 'PM',
  time: string,              // '06:00', '07:30' — 24h format
  maxCapacity: number,
  isActive: boolean,         // false = soft-deleted or paused
  createdAt: Date,
  updatedAt: Date,
}
```

### `ClassSession`
A specific dated occurrence of a class. Generated from templates by the weekly cron job. Do NOT manually create these outside of the cron or seed logic.

```typescript
{
  _id: ObjectId,
  templateId: ObjectId,      // ref: ScheduleTemplate
  coachId: ObjectId,         // ref: User — denormalized for fast coach queries
  date: Date,                // midnight UTC of the specific day
  period: 'AM' | 'PM',      // denormalized from template
  time: string,              // denormalized from template
  maxCapacity: number,       // denormalized — snapshot at time of generation
  status: 'scheduled' | 'completed' | 'cancelled',
  createdAt: Date,
}
```

**Indexes:**
- `{ coachId: 1, date: 1 }` — coach day/week views
- `{ date: 1, period: 1 }` — client browse by AM/PM
- `{ templateId: 1, date: 1 }` — cron deduplication check

### `ClientDefaultSchedule`
A client's standing weekly preference. Each document = one recurring slot they attend by default.

```typescript
{
  _id: ObjectId,
  clientId: ObjectId,        // ref: User (role: client)
  templateId: ObjectId,      // ref: ScheduleTemplate
  isActive: boolean,
  createdAt: Date,
}
```

**Indexes:**
- `{ clientId: 1 }` — fetch all defaults for a client
- `{ templateId: 1, isActive: 1 }` — cron enrollment step

### `Enrollment`
A client's registration for a specific session. Auto-generated from defaults by cron, or manually created for one-off changes.

```typescript
{
  _id: ObjectId,
  sessionId: ObjectId,       // ref: ClassSession
  clientId: ObjectId,        // ref: User
  source: 'default' | 'override',
  status: 'enrolled' | 'skipped',
  enrolledAt: Date,
}
```

**Indexes:**
- `{ sessionId: 1, status: 1 }` — roster queries, available spots count
- `{ clientId: 1, sessionId: 1 }` — unique constraint (one enrollment per client per session)

### `Attendance`
Written by coaches during or after class. Separate from Enrollment — a missing attendance record means the coach hasn't recorded yet, not that the client didn't show.

```typescript
{
  _id: ObjectId,
  sessionId: ObjectId,       // ref: ClassSession
  clientId: ObjectId,        // ref: User
  status: 'present' | 'absent' | 'late',
  recordedBy: ObjectId,      // coachId
  recordedAt: Date,
}
```

**Indexes:**
- `{ sessionId: 1 }` — fetch all attendance for a session
- `{ clientId: 1, sessionId: 1 }` — unique constraint

---

## Weekly Cron Job

**Schedule:** Runs Sunday at 11pm (or configurable)
**Purpose:** Generate next week's ClassSessions and auto-enroll clients from their defaults

```
1. Compute the 7 dates for the upcoming Mon–Sun
2. Fetch all active ScheduleTemplates
3. For each template:
   a. For the date matching template.dayOfWeek:
      - Check if a ClassSession already exists for (templateId, date) — skip if so
      - Create ClassSession with status: 'scheduled'
   b. Fetch all active ClientDefaultSchedule records where templateId matches
   c. For each client, create Enrollment { source: 'default', status: 'enrolled' }
      - Skip if enrollment already exists (upsert on sessionId + clientId)
```

**Location:** `packages/server/src/jobs/generateWeeklySchedule.ts`
Use a library like `node-cron` or trigger via an admin endpoint for manual runs.

---

## API Endpoints

### Schedule Templates (Admin)
- `GET /api/schedule/templates` — list all templates
- `POST /api/schedule/templates` — create a template
- `PATCH /api/schedule/templates/:id` — update (e.g. change time, capacity)
- `DELETE /api/schedule/templates/:id` — soft delete (sets isActive: false)

### Class Sessions
- `GET /api/schedule/sessions?date=&period=&coachId=` — client browse view
- `GET /api/schedule/sessions/:id` — single session with roster + available spots
- `GET /api/schedule/sessions/coach/:coachId?date=` — coach day view
- `GET /api/schedule/sessions/coach/:coachId/week?startDate=` — coach week view (returns sessions with enrollment counts)

### Enrollments
- `POST /api/schedule/sessions/:sessionId/enroll` — client enrolls (creates override enrollment; if client has a default for this week on a different day, mark that as skipped)
- `DELETE /api/schedule/sessions/:sessionId/enroll` — client unenrolls (mark as skipped if source: default, delete if source: override)

### Client Defaults
- `GET /api/schedule/defaults` — get current user's default schedule
- `POST /api/schedule/defaults` — add a default slot
- `DELETE /api/schedule/defaults/:id` — remove a default slot

### Attendance
- `POST /api/schedule/sessions/:sessionId/attendance` — coach submits attendance (array of { clientId, status })
- `GET /api/schedule/sessions/:sessionId/attendance` — get attendance for a session

---

## Mobile UI Flows

### Client: Browse & Enroll
1. **Period picker** — AM / PM toggle
2. **Time picker** — list of available times for that period (derived from sessions on the selected date)
3. **Coach list** — coaches running that time slot, showing `maxCapacity - enrolledCount` spots remaining
4. **Session detail** — class roster, enroll/unenroll button

### Client: My Schedule
- List of their active default slots
- Ability to add/remove defaults
- View upcoming week's sessions they're enrolled in

### Coach: Today View (default landing)
- Auto-loads today's sessions for the logged-in coach
- Each session shows roster with present/absent toggle per client
- Submit attendance button marks session as 'completed'

### Coach: Day Navigation
- Back/forward arrows to move day by day
- Shows all sessions for that coach on that date

### Coach: Week View
- 7-column grid (Mon–Sun)
- Each cell shows the session time + enrolled client count
- Tap a cell → drill into that session's roster

---

## Implementation Order

1. **Shared types** (`packages/shared`) — add all interfaces and Zod schemas for the 5 collections
2. **Server models** — Mongoose schemas with indexes
3. **Cron job** — weekly session + enrollment generation (test with a manual trigger endpoint)
4. **Core session APIs** — templates CRUD, session queries, enrollment endpoints
5. **Attendance API** — coach attendance submission
6. **Mobile: Client flow** — period → time → coach → enroll
7. **Mobile: Coach day view** — roster + attendance marking
8. **Mobile: Coach week view** — grid + drill-down
9. **Client defaults** — API + mobile UI for managing standing schedule

---

## Key Business Rules to Enforce

- A client cannot be enrolled in two sessions on the same day (validate in enroll endpoint)
- Enrollment should be blocked if session is at `maxCapacity`
- Only coaches can submit attendance; only for their own sessions
- Attendance can only be submitted for sessions with `status: 'scheduled'` (not cancelled)
- Changing a `ScheduleTemplate` (e.g. time change) should NOT retroactively update already-generated `ClassSession` records — those are snapshots
- Deactivating a template stops future session generation but does not cancel already-scheduled sessions

---

## Open Questions (resolve before implementation)
- Can clients enroll in a session they don't have a default for, or only switch within their existing default days?
  Yes, they can enroll in a session they don't have a default for
- Is there a cutoff time for enrolling/unenrolling (e.g. no changes within 1 hour of class)?
  No
- Do coaches see all sessions at their gym, or only their own?
  They can see all of them
- Should the admin be able to manually override enrollment (e.g. add a client to a full class)?
  Yes

## Comments
The "cancelled" status for a session is unnecessary. If a session is cancelled it can just be deleted. 

---

## Client App: Owner Schedule Management

The existing `SchedulesPage` in the client app was built for an older scheduling model (templates with embedded weekly day/timeslot grids, an "active schedule" layer). That model is replaced by this plan. The existing client-side scheduling code — `SchedulesPage`, `ScheduleTemplateEditPage`, all sub-components under `schedules/`, and related hooks — needs to be replaced, not extended.

The new `SchedulesPage` has three tabs: **Templates**, **Sessions**, and **Generate**.

### Data Model Addition

Add `endTime: string` (24h `"HH:mm"` format) to `ScheduleTemplate` to support overlap detection. Validate `endTime > time` in the server schema. This is additive — it does not affect already-generated `ClassSession` records.

Files to update: `packages/shared/src/types/schedules.ts`, `packages/shared/src/schemas/schedules.ts`, `packages/server/src/models/ScheduleTemplate.ts`.

---

### Templates Tab

Replaces the old TemplateTab and `ScheduleTemplateEditPage` (which becomes a modal instead of a separate route).

**Table columns:** Day of Week, Period, Start Time, End Time, Coach, Capacity, Active (badge), Conflicts (warning icon)

**Actions:**
- **Create** — opens a modal with: day of week, period (AM/PM), start time, end time, max capacity, coach (dropdown of gym's coaches)
- **Edit** (pencil per row) — same modal, pre-filled. Shows inline note: "Changes apply to future generated sessions only"
- **Deactivate / Reactivate** toggle — sets `isActive: false/true`; does not cancel already-scheduled sessions
- **Delete** — hard delete; only allowed if the template has no associated `ClassSession` records

**Overlap detection** (computed client-side, no extra endpoint):
Two active templates in the same gym conflict if they share the same `dayOfWeek` and their time windows intersect:
```
overlap(a, b) = a.dayOfWeek === b.dayOfWeek && a.time < b.endTime && b.time < a.endTime
```
- Conflict indicator (warning icon) shown per row in the table
- "Show conflicts only" filter toggle to isolate overlapping templates
- On save in create/edit modal: non-blocking inline warning if the template would overlap an existing active template

---

### Sessions Tab

New view — no equivalent in the current client app. Lets the owner see all sessions across all coaches for the gym.

**Controls:**
- Week picker (defaults to current week) with prev/next arrows
- Filter by: period (AM/PM), coach (multi-select)

**Session list:** date, day, time, period, coach name, enrolled / capacity, status badge

**Session detail** (modal or slide-out on row click):
- Full roster: client name, enrollment source (`default` / `override`), enrollment status
- **Add Client** — dropdown of gym's active clients; bypasses capacity check (owner override → `POST /sessions/:sessionId/enroll/admin`)
- **Remove client** per row
- **Delete session** button — deletes the `ClassSession` record outright (no cancel status per above)

---

### Generate Tab

Replaces the old GenerateTab.

- Week selector (Monday date picker, defaults to next Monday)
- "Generate Week" button → `POST /generate-week`
- Result summary: "X sessions created, Y enrollments auto-created"
- Server handles deduplication; surface the result counts so the owner can confirm what was generated

---

### Files to Replace

**Delete entirely:**
- `packages/client/src/pages/ScheduleTemplateEditPage.tsx`
- `packages/client/src/components/schedules/ActiveTab/` (all 6 components)
- `packages/client/src/components/schedules/TemplateTab/` (all 4 components)
- `packages/client/src/components/schedules/TemplateEdit/` (all 3 components)
- `packages/client/src/hooks/useActiveSchedule.ts`
- `packages/client/src/hooks/useScheduleTemplates.ts`

**Rewrite:**
- `packages/client/src/pages/SchedulesPage.tsx` — new 3-tab layout
- `packages/client/src/services/scheduleApi.ts` — updated to new endpoints

**Keep / adapt:**
- `packages/client/src/components/schedules/GenerateTab/GenerateSessionsPanel.tsx`
- `packages/client/src/components/schedules/shared/EmptyState.tsx`
- Route `/schedules` in `App.tsx` (remove `/schedules/templates/:templateId/edit`)

---

### API Endpoints Used

- `GET /api/schedule/templates` — list templates
- `POST /api/schedule/templates` — create
- `PATCH /api/schedule/templates/:id` — update (time, endTime, capacity, coach, isActive)
- `DELETE /api/schedule/templates/:id` — hard delete (only if no sessions exist)
- `GET /api/schedule/sessions?weekStart=&period=&coachId=` — session list for a week
- `GET /api/schedule/sessions/:id` — session detail with roster
- `POST /api/schedule/sessions/:sessionId/enroll/admin` — owner override enroll (bypasses capacity)
- `DELETE /api/schedule/sessions/:sessionId/enroll` — remove a client's enrollment
- `DELETE /api/schedule/sessions/:id` — delete a session
- `POST /api/schedule/generate-week` — trigger weekly generation
