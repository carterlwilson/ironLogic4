# IronLogic4 ChatGPT scheduling integration

The stateless Streamable HTTP endpoint is `/mcp`. It exposes exactly the seven operation IDs in `ironlogic4-chatgpt-scheduling-openapi-v2.yaml`. It has no resource, prompt, generic HTTP, schedule creation, self-join, or user-management tools. The supplied YAML remains unchanged.

Authentication fields are removed recursively from both MCP text and structured responses. This protects the integration from the existing client lookup serializer, which can include `refreshTokens`. The underlying client API serializer is unchanged; its broader exposure should be addressed separately.

The installed SDK's HTTP transport dependency requires Node.js 20 or later. Verification ran on Node.js 23; use a supported Node.js release at least 20 when deploying this integration.

## Authentication changes

The existing `/api/auth/login` and `/api/auth/refresh` issue application JWTs and rotating application refresh tokens. They are not OAuth endpoints. Existing route middleware resolves the user from MongoDB; controllers enforce roles, gym scope, coach assignment, enrollment capacity, and duplicate assignment rules.

ChatGPT needs OAuth account linking for this private MCP surface. The added layer uses a predefined confidential OAuth client and authorization codes with S256 PKCE. It adds discovery at `/.well-known/oauth-authorization-server` and `/.well-known/oauth-protected-resource/mcp`, plus `/oauth/authorize` and `/oauth/token`. No existing login or refresh behavior changes.

Only `MCP_APPROVED_USER_ID` can link. The linking form asks for that account's existing IronLogic4 JWT as proof and presents the scheduling access being granted. The token stays in the form POST and is not stored. Do not paste it into chat, source, URLs, or tool arguments. Authorization codes are stored hashed in MongoDB, expire after five minutes, and are atomically consumed with client, redirect, resource, and PKCE bindings. The `McpAuthorizationCode` collection needs its unique and TTL indexes provisioned if production disables automatic indexes; expiry is also checked during exchange.

MCP access tokens expire after 30 minutes and use a separate signing secret, issuer, audience, subject, and scheduling scope. They intentionally contain no application `userId` claim and are not usable as application JWTs. Each MCP request checks the approved subject and that the account still exists, then creates a transient application JWT used only for calls to the seven existing local API routes. Application middleware and controllers still make authorization decisions. No shared approved-user token is loaded from an environment variable or forwarded for unrelated callers.

This minimal flow does not issue refresh tokens or request `offline_access`; reconnect/relink when authorization expires. It does not add password login, automatic client registration, or an identity provider. An established OAuth provider can replace this small linking layer later. MCP tokens are stateless: to revoke the one account's connection immediately, change `MCP_APPROVED_USER_ID`, unset configuration, or rotate `MCP_OAUTH_SECRET`.

## Configuration and connection

Set the following in the hosting provider's secret configuration, never in committed source:

- `MCP_PUBLIC_ORIGIN`: canonical HTTPS backend origin, with no trailing slash or path.
- `MCP_APPROVED_USER_ID`: existing approved user's MongoDB ID. Its existing permissions determine which tools can succeed.
- `MCP_OAUTH_SECRET`: a separate random secret of at least 32 characters, different from `JWT_SECRET`.
- `MCP_OAUTH_CLIENT_ID` and `MCP_OAUTH_CLIENT_SECRET`: credentials for this predefined ChatGPT OAuth client.
- `MCP_OAUTH_REDIRECT_URI`: exact callback displayed by ChatGPT for this connection.
- `MCP_ALLOWED_ORIGINS`: optional comma-separated explicit browser origins; defaults to the public origin and `https://chatgpt.com`. Requests without an Origin header, such as server-to-server ChatGPT calls, are allowed.

All six OAuth configuration fields are required; otherwise MCP and discovery return 503. Invalid complete configuration fails startup. Existing `JWT_SECRET`, MongoDB, port, logging, and rate-limiting conventions continue to apply. The adapter calls the existing API on `127.0.0.1` using `PORT`, never a caller-selected URL. Reverse proxies must preserve the canonical Host. For browser test clients, add their exact origin to both the MCP origin list and existing CORS settings.

After deploying, configure a ChatGPT developer-mode connection to `https://YOUR_BACKEND/mcp` with OAuth and the predefined client ID/secret. Copy its exact redirect URL to the backend configuration. Link using the approved user's current JWT. Deployment and live ChatGPT connection were not performed by this change.

## Scheduling behavior

Availability remains `{success, data: [...]}`. An active schedule's `id` is the enrollment schedule ID; populated `gymId.id` and `templateId.id` are references. Timeslot IDs, availability, assigned client IDs, coach details, and location remain intact. Tool descriptions instruct ChatGPT to clarify clients, recurring versus current-week requests, and simultaneous slots by coach or location. They do not programmatically infer intent: writes require explicit schedule, timeslot, and client IDs. `isUserAssigned` refers to the linked account; inspect `assignedClients` for a different selected client. The API supplies no timezone or class date, so the adapter does not invent future-week semantics.

Writes are marked as destructive tools for host confirmation. The adapter never retries a write automatically, and reports success only for an HTTP success response whose body has `success: true`. A transport failure may leave a write's outcome unknown; inspect assignments before retrying.

## Verification

Run `npm run test:mcp` and `npm run typecheck` from `packages/server`. MCP tests use the SDK client over both in-memory transport and a temporary local HTTP server, mocked backend responses, and mocked database persistence. They verify the seven-operation YAML allowlist, request mapping, untouched availability data, rejected inputs, HTTP failures, PKCE binding, approved-user linking, code replay and expiry, token claim validation, and backend role denial through HTTP MCP. They never use a real token or database.

The existing `npm test` integration suite seeds and removes MongoDB fixtures using the configured database. Run it only against a designated test database and a running backend. It was not used for this integration.

Official account-linking requirements: https://developers.openai.com/plugins/build/auth
