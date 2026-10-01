import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

export const mcpScope = 'scheduling';
export const digest = (value: string) => crypto.createHash('sha256').update(value).digest('base64url');

export function oauthConfig() {
  const origin = process.env.MCP_PUBLIC_ORIGIN;
  const secret = process.env.MCP_OAUTH_SECRET;
  const clientId = process.env.MCP_OAUTH_CLIENT_ID;
  const clientSecret = process.env.MCP_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.MCP_OAUTH_REDIRECT_URI;
  const userId = process.env.MCP_APPROVED_USER_ID;
  if (!origin || !secret || !clientId || !clientSecret || !redirectUri || !userId) return null;
  const url = new URL(origin);
  if (url.protocol !== 'https:' || url.origin !== origin || secret.length < 32 || secret === process.env.JWT_SECRET) {
    throw new Error('MCP OAuth requires an HTTPS origin and a secret of at least 32 characters');
  }
  const redirect = new URL(redirectUri);
  if (redirect.protocol !== 'https:' || redirect.username || redirect.password || redirect.hash) {
    throw new Error('MCP OAuth redirect must be an HTTPS URL without credentials or fragment');
  }
  return { origin, resource: `${origin}/mcp`, secret, clientId, clientSecret, redirectUri, userId };
}

export const authorizationSchema = z.object({
  response_type: z.literal('code'),
  client_id: z.string(),
  redirect_uri: z.string(),
  resource: z.string(),
  scope: z.literal(mcpScope),
  state: z.string().min(1).max(2048),
  code_challenge: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
  code_challenge_method: z.literal('S256'),
});

export function matchesAuthorization(input: z.infer<typeof authorizationSchema>, config: NonNullable<ReturnType<typeof oauthConfig>>) {
  return input.client_id === config.clientId && input.redirect_uri === config.redirectUri && input.resource === config.resource;
}

export function issueMcpToken(userId: string, config: NonNullable<ReturnType<typeof oauthConfig>>) {
  return jwt.sign({ scope: mcpScope }, config.secret, {
    algorithm: 'HS256', subject: userId, issuer: config.origin, audience: config.resource, expiresIn: '30m',
  });
}

export function verifyMcpToken(token: string, config: NonNullable<ReturnType<typeof oauthConfig>>) {
  const claims = jwt.verify(token, config.secret, { algorithms: ['HS256'], issuer: config.origin, audience: config.resource });
  if (typeof claims === 'string' || claims.sub !== config.userId || claims.scope !== mcpScope || typeof claims.exp !== 'number') {
    throw new Error('Invalid MCP principal or scope');
  }
  return claims.sub;
}

export function matchesSecret(actual: string, expected: string) {
  const left = Buffer.from(digest(actual));
  const right = Buffer.from(digest(expected));
  return crypto.timingSafeEqual(left, right);
}
