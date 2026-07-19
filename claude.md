
# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

# IronLogic4 Monorepo

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

# IronLogic4 Monorepo
## Project Structure

This is a TypeScript monorepo with 4 main packages:

- **Server** (`packages/server`): Express.js API with MongoDB and JWT authentication
- **Client** (`packages/client`): Vite + React SPA with React Router and Mantine v7
- **Shared** (`packages/shared`): Common TypeScript types, schemas, and utilities
- **Mobile** (`packages/mobile`): PWA mobile experience with offline support

## Development Commands

### Root Level
- `npm run dev` - Start both server and client in development mode
- `npm run build` - Build all packages
- `npm run test` - Run tests in all packages
- `npm run lint` - Lint all packages
- `npm run typecheck` - Type check all packages
- `npm run clean` - Clean all build artifacts

### Server Package (`packages/server`)
- `npm run dev -w packages/server` - Start server in development mode (port 3001)
- `npm run build -w packages/server` - Build server
- `npm run start -w packages/server` - Start production server

### Client Package (`packages/client`)
- `npm run dev -w packages/client` - Start client in development mode (port 3000)
- `npm run build -w packages/client` - Build client for production
- `npm run preview -w packages/client` - Preview production build

### Mobile Package (`packages/mobile`)
- `npm run dev -w packages/mobile` - Start mobile PWA in development mode (port 3002)
- `npm run build -w packages/mobile` - Build mobile PWA for production

### Shared Package (`packages/shared`)
- `npm run build -w packages/shared` - Build shared types and utilities
- `npm run dev -w packages/shared` - Watch mode for shared package

## Technology Stack

### Server
- Express.js with TypeScript
- MongoDB with Mongoose
- JWT authentication with bcryptjs
- Security middleware (helmet, cors, rate limiting)
- Zod for validation

### Client
- React 18 with TypeScript
- Vite for build tooling
- React Router for routing
- Mantine v7 for UI components
- Vitest for testing

### Mobile
- React 18 with TypeScript
- Vite with PWA plugin
- Workbox for service worker functionality
- Mobile-optimized Mantine components
- Offline support and caching

### Shared
- TypeScript types and interfaces
- Zod schemas for validation
- Common utilities and helpers

## Environment Setup

1. Copy `.env.example` to `.env` in the server package
2. Configure MongoDB connection string
3. Set JWT secret and other environment variables

## Deployment

The monorepo is designed to be cloud-agnostic:
- Each package can be deployed independently
- Server can be deployed to any Node.js hosting provider
- Client and Mobile can be deployed to static hosting (Vercel, Netlify, etc.)
- Shared package is consumed as a workspace dependency

## Architecture Notes

- Uses npm workspaces for monorepo management
- Shared package provides common types and utilities
- Client and Mobile packages can share code via the shared package
- Server uses the shared package for type safety and validation
- All packages are written in TypeScript for type safety