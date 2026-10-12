# IronLogic4 ChatGPT scheduling integration

The stateless Streamable HTTP endpoint is `/mcp`. It exposes exactly the seven operation IDs in `ironlogic4-chatgpt-scheduling-openapi-v2.yaml`. No scheduling tools or existing backend enrollment permissions change in this update. Authentication fields are removed from MCP text and structured responses, including refresh tokens exposed by the existing client API serializer.

## Account linking

The linking page at `/oauth/authorize` now accepts the user's normal IronLogic4 email and password. It uses the existing login validation and password comparison method, without invoking application login or creating application refresh tokens. Credentials are sent only to the backend over HTTPS, are not retained on retry, and never enter ChatGPT messages or tool arguments. A required consent checkbox explains scheduling access and, when requested, a connection lasting up to 365 days.

Only existing, non-invited users in the effective allowlist can link. Authentication failures use the same generic message for unknown accounts, bad passwords, and ineligible users. A separate limit permits 10 authorization submissions per IP per 15 minutes, alongside the existing server rate limiter. Each five-minute signed linking transaction is bound to a random browser nonce in a Secure, HttpOnly, SameSite=Lax `__Host-mcp-link` cookie. Submissions reject missing/mismatched cookies and cross-origin requests; successful linking clears the cookie. Local browser testing requires HTTPS because the production cookie settings remain enabled.

Existing `/api/auth/login`, `/api/auth/refresh`, application JWT validation, application token lifetimes, and `User.refreshTokens` are unchanged. Backend roles, gym scope, coach assignment, and enrollment rules remain authoritative. Adding a CLIENT account to the allowlist does not grant staff-only enrollment permissions.

## Render configuration

Keep the existing environment values:

- `MCP_PUBLIC_ORIGIN`: canonical HTTPS backend origin without trailing slash or path.
- `MCP_OAUTH_SECRET`: separate random signing secret of at least 32 characters, different from `JWT_SECRET`.
- `MCP_OAUTH_CLIENT_ID` and `MCP_OAUTH_CLIENT_SECRET`: predefined OAuth client credentials matching the ChatGPT connection.
- `MCP_OAUTH_REDIRECT_URI`: exact callback shown by ChatGPT for this connection.
- `MCP_ALLOWED_ORIGINS`: optional browser-origin allowlist, defaulting to the backend origin and `https://chatgpt.com`.

Add `MCP_ALLOWED_USER_IDS` in Render's backend environment settings with comma-separated MongoDB user IDs, for example `USER_ID_1,USER_ID_2`. Include your customer's normal account ID, not their email or the OAuth client ID. Accounts must already exist and have a usable password; the older integration-account script assigns a random password and does not supply it for normal login. Use the existing password reset flow if that account needs a known password.

When `MCP_ALLOWED_USER_IDS` is absent, the existing `MCP_APPROVED_USER_ID` remains the single-user fallback. When the new variable is present, it replaces that fallback entirely, even when blank. A blank effective list disables linking, discovery, and MCP access with 503 responses. Missing OAuth configuration also returns 503; invalid complete configuration fails startup. Adding/removing allowed IDs takes effect after Render applies the new environment configuration. Removing an ID blocks both access and refresh, including legacy MCP tokens.

No existing signing/client secrets need rotation for this feature. Never commit production values. The installed SDK HTTP dependency requires Node.js 20 or later. Reverse proxies must preserve the canonical Host, and the existing one-hop trust-proxy configuration must correctly identify client IPs for rate limiting.

## Refresh tokens and revocation

Discovery advertises `authorization_code` and `refresh_token` grants, S256 PKCE, `client_secret_post`, and scopes `scheduling` and `offline_access`. The scheduling scope is mandatory; unsupported scopes are rejected. Scope order/duplicates are normalized. The browser consent covers the requested scopes. Authorization codes persist the granted scope and authenticated user ID; they remain hashed, expire after five minutes, and are atomically consumed with client, resource, callback, and PKCE bindings. Eligibility is checked again during exchange.

With `offline_access`, code exchange creates a connection with a fixed expiry exactly 365 days later and returns a 30-minute access token plus a random refresh token. Without `offline_access`, it creates a 30-minute connection and returns no refresh token. Refresh requests use `/oauth/token` with `grant_type=refresh_token`, `client_id`, `client_secret`, `resource`, and `refresh_token`. If `scope` is sent, it must match the connection's granted scopes; scope narrowing is not supported in this update.

OAuth connections and hashed refresh tokens use separate `McpConnection` and `McpRefreshToken` collections. Every refresh atomically consumes the previous token and creates a new token while preserving the original connection expiry. Consumed hashes are retained until that expiry to detect reuse. A reused token revokes the entire connection, including its current access token. Concurrent use of the same refresh token can therefore require relinking; clients should serialize refresh requests. Persistence failures return no tokens and revoke partially issued connections where possible. Database errors also prevent MCP connection verification.

New access tokens contain a connection ID, subject, issuer, resource audience, and granted scopes, and expire at the earlier of 30 minutes or connection expiry. MCP calls and refresh check connection expiry/revocation, account existence, invitation status, and the current allowlist. Tokens never contain the application `userId` claim and cannot authenticate to the application API. The adapter creates an internal transient application JWT for the linked user and delegates only the seven allowed operations to existing local API routes.

For immediate revocation of an individual connection, set its `revokedAt` in MongoDB. Removing an account from the Render allowlist blocks all its connections. Rotating `MCP_OAUTH_SECRET` invalidates all MCP access tokens, but does not remove stored refresh authorizations; rotate the OAuth client secret or revoke connections as well if those must be invalidated. OAuth refresh tokens are independent of application password changes and application logout; those behaviors are unchanged in this update.

## Deployment and transition

Provision the unique/TTL indexes on `McpAuthorizationCode`, `McpConnection`, and `McpRefreshToken` if production disables Mongoose automatic indexes. Expiry is explicitly checked even before MongoDB's TTL cleanup. No User migration or existing application refresh-token migration is required.

After deployment, refresh the MCP connection metadata in ChatGPT so it sees refresh-token support and `offline_access`. Relink once using the allowed account's normal email/password and persistent consent. Verify the token response includes a refresh token when `offline_access` was requested. Existing MCP access tokens without a connection ID remain accepted until their original expiry, subject to eligibility and the allowlist, but have no refresh authorization and require relinking.

Verify a client lookup and the linked account's existing enrollment permissions. After the access token expires, confirm ChatGPT refreshes through `/oauth/token` and performs another lookup without prompting for login. Backend access expires after 365 days even with regular use, requiring fresh consent and login. Deployment and live ChatGPT refresh verification are not performed by the local test suite.

Availability stays `{success, data: [...]}`. Active schedule `id` and timeslot `id` are used for active enrollment; populated `gymId` and `templateId` are reference objects. Assigned client IDs, availability, coaches, and locations remain intact. Tool instructions require clarification for ambiguous clients/slots and recurring versus current-week intent. The API supplies no class date or timezone; future-week semantics are not inferred. Writes are never retried automatically and succeed only on an HTTP success with `success: true`.

## Verification

Run `npm run test:mcp`, `npm run typecheck`, and `npm run build` from `packages/server`. Tests use the MCP SDK over in-memory and temporary HTTP transports, with mocked MongoDB persistence. They cover allowlist precedence, login eligibility/consent/browser binding/rate limits, code bindings/expiry/replay, rotation/reuse/concurrency, account removal, persistence failure, the fixed yearly expiry, legacy tokens, distinct user identities and backend roles, and the seven-tool contract and secret redaction. Mocked persistence is not a substitute for validating production MongoDB indexes or live ChatGPT automatic refresh.

The existing `npm test` integration suite writes fixtures to the configured database. Run it only with a designated test database and running backend. Repository lint currently has no ESLint configuration.

Official authentication requirements: https://developers.openai.com/plugins/build/auth
