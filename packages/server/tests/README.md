# Integration tests

These are **live-server integration tests**, not run in CI. They make real HTTP requests
against an already-running local dev server and read/write your local MongoDB directly to set
up fixtures and simulate the passage of time (e.g. backdating a `recordedAt` field to exercise
the 5-day staleness threshold without waiting 5 real days).

Do not run against production data.

## Running

```bash
# 1. Make sure local MongoDB is running (however you normally start it), e.g.:
mongod --dbpath <your-local-path>
# or: brew services start mongodb-community

# 2. In one terminal, start the dev server:
npm run dev -w packages/server

# 3. In another terminal, run the suite:
npm run test -w packages/server
```

Reruns are safe: `globalSetup` sweeps and removes any leftover fixture from a crashed prior run
before recreating fresh ones, and `globalTeardown` removes exactly what it created on a clean
exit. Each test file also resets its own scratch state (deleting a template's existing benchmark
before creating a fresh one) at the points where a clean slate matters.

Note: the root-level `npm test` (which runs `test` across all workspaces) will also pick up this
suite and fail/hang if the dev server + MongoDB aren't already running.
