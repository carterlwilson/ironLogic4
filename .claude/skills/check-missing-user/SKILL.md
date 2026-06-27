---
name: check-missing-user
description: Check whether a user exists in the Cully Strength prod MongoDB, look up their old app benchmark data, map it to the current templates, and show a preview before adding anything. Use when the user says a member may be missing from the new app.
user-invocable: true
---

# Check Missing User

Use this skill when the user asks to check whether a specific user is in the new app database.

## Key constants
- **Prod MongoDB URI env var:** `MONGODB_PROD_URI` (in `packages/server/.env`)
- **Gym ID:** `6912617d4d2e5e9cc486e33f`
- **Old app user export:** `packages/server/output/users-oldApp.json`
- **Benchmark templates:** `packages/server/output/benchmark-templates.json`
- **Default password:** `CullyStrength123` (bcrypt hash before inserting)
- **userType value:** `'client'` (lowercase — never uppercase 'CLIENT')

## Step 1: Check the database

Run an inline `npx tsx` script (NOT any existing script in `src/scripts/`) to look up the email:

```bash
MONGODB_PROD_URI=$(grep MONGODB_PROD_URI packages/server/.env | cut -d= -f2-) npx tsx - <<'EOF'
import mongoose from 'mongoose';
await mongoose.connect(process.env.MONGODB_PROD_URI);
const db = mongoose.connection.db;
const user = await db.collection('users').findOne({ email: '<email>' });
if (user) {
  console.log('FOUND:', user.firstName, user.lastName, '| gymId:', user.gymId, '| benchmarks:', user.currentBenchmarks?.length ?? 0);
} else {
  console.log('NOT FOUND');
}
await mongoose.disconnect();
EOF
```

**If found:** Report what's there (name, gymId, benchmark count). Stop unless the user asks to investigate further.

**If not found:** Proceed to Step 2.

## Step 2: Look up old app data

Search `packages/server/output/users-oldApp.json` for the email (case-insensitive). Show the user's name and their raw `maxes` array.

If not in the old app data either, report that and stop.

## Step 3: Map benchmarks to current templates

Load `packages/server/output/benchmark-templates.json`. The templates are consolidated — one document per exercise with multiple rep maxes inside (`templateRepMaxes`) or time sub-maxes (`templateTimeSubMaxes`).

**Mapping rules:**
- `"5RM Squat"` → Squat template, 5RM entry
- `"3RM Bench Press"` → Bench Press template, 3RM entry
- `"BenchPress"` / `"Squat"` / bare names → treat as 1RM of that exercise (confirm with user if values seem anomalous)
- `"5 Min Bike (KM)"` → Bike - Distance template, `timeSubMaxes`, value is `distanceMeters`. **Bike template unit is kilometers** — confirm with user whether the raw value is already in meters or KM before storing.
- `"5 Min Row (Meters)"` / `"5 Min Ski Erg (Meters)"` → Row/Ski Distance template, value is already meters → store as-is
- No matching template → note as skipped, do not invent a template

Group matched entries by template (one benchmark document per template, multiple repMaxes inside).

## Step 4: Show preview and wait for approval

Present clearly to the user:
- What will be added (name, lastName, each benchmark with rep/distance values)
- What is being skipped (no matching template)
- Any anomalies (e.g. 3RM > 1RM, bike value ambiguity)

**Do not insert anything until the user explicitly approves.**

## Step 5: Insert (after approval)

Write a temporary script to `packages/server/src/scripts/addUser<Name>.ts`, run it, then delete it. Key points:
- `userType: 'client'` (lowercase)
- Use `$push: { currentBenchmarks: { $each: [...] } }` if adding benchmarks to an existing user
- Use `insertOne` for new users with all fields: `email`, `firstName`, `lastName`, `userType`, `password` (bcrypt hashed), `gymId`, `currentBenchmarks`, `historicalBenchmarks: []`, `createdAt`, `updatedAt`
- Use `new Types.ObjectId()` for each benchmark `_id`

Run with:
```bash
MONGODB_PROD_URI=$(grep MONGODB_PROD_URI packages/server/.env | cut -d= -f2-) npx tsx packages/server/src/scripts/addUser<Name>.ts && rm packages/server/src/scripts/addUser<Name>.ts
```
