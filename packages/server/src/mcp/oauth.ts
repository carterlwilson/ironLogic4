import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User.js';
import { McpConnection } from '../models/McpConnection.js';

export const mcpScope = 'scheduling';
export const scopeSchema = z.string().transform(value => [...new Set(value.trim().split(/\s+/))].sort().join(' '))
  .refine(value => value.split(' ').includes(mcpScope) && value.split(' ').every(scope => [mcpScope, 'offline_access'].includes(scope)), 'Invalid scope');
export const digest = (value: string) => crypto.createHash('sha256').update(value).digest('base64url');

export function oauthConfig() {
  const origin = process.env.MCP_PUBLIC_ORIGIN;
  const secret = process.env.MCP_OAUTH_SECRET;
  const clientId = process.env.MCP_OAUTH_CLIENT_ID;
  const clientSecret = process.env.MCP_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.MCP_OAUTH_REDIRECT_URI;
  const allowedUserIds = (process.env.MCP_ALLOWED_USER_IDS ?? process.env.MCP_APPROVED_USER_ID ?? '')
    .split(',').map(value => value.trim()).filter(Boolean);
  if (!origin || !secret || !clientId || !clientSecret || !redirectUri || !allowedUserIds.length) return null;
  const url = new URL(origin);
  if (url.protocol !== 'https:' || url.origin !== origin || secret.length < 32 || secret === process.env.JWT_SECRET) {
    throw new Error('MCP OAuth requires an HTTPS origin and a secret of at least 32 characters');
  }
  const redirect = new URL(redirectUri);
  if (redirect.protocol !== 'https:' || redirect.username || redirect.password || redirect.hash) {
    throw new Error('MCP OAuth redirect must be an HTTPS URL without credentials or fragment');
  }
  return { origin, resource: `${origin}/mcp`, secret, clientId, clientSecret, redirectUri, allowedUserIds };
}

export const authorizationSchema = z.object({
  response_type: z.literal('code'),
  client_id: z.string(),
  redirect_uri: z.string(),
  resource: z.string(),
  scope: scopeSchema,
  state: z.string().min(1).max(2048),
  code_challenge: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
  code_challenge_method: z.literal('S256'),
});

export function matchesAuthorization(input: z.infer<typeof authorizationSchema>, config: NonNullable<ReturnType<typeof oauthConfig>>) {
  return input.client_id === config.clientId && input.redirect_uri === config.redirectUri && input.resource === config.resource;
}

export function issueMcpToken(userId: string, config: NonNullable<ReturnType<typeof oauthConfig>>, connection?: { id: string; scope: string; expiresAt: Date }) {
  const exp = Math.min(Math.floor(Date.now() / 1000) + 1800, connection ? Math.floor(connection.expiresAt.getTime() / 1000) : Infinity);
  return jwt.sign({ scope: connection?.scope || mcpScope, ...(connection ? { connectionId: connection.id } : {}), exp }, config.secret, {
    algorithm: 'HS256', subject: userId, issuer: config.origin, audience: config.resource,
  });
}

export function verifyMcpToken(token: string, config: NonNullable<ReturnType<typeof oauthConfig>>) {
  const claims = jwt.verify(token, config.secret, { algorithms: ['HS256'], issuer: config.origin, audience: config.resource });
  if (typeof claims === 'string' || !claims.sub || !config.allowedUserIds.includes(claims.sub) || !scopeSchema.safeParse(claims.scope).success || typeof claims.exp !== 'number'
    || (claims.connectionId !== undefined && (typeof claims.connectionId !== 'string' || !/^[a-f0-9]{24}$/i.test(claims.connectionId)))) {
    throw new Error('Invalid MCP principal or scope');
  }
  return { userId: claims.sub, connectionId: claims.connectionId as string | undefined, scope: claims.scope as string };
}

export async function eligibleMcpUser(userId: string, config: NonNullable<ReturnType<typeof oauthConfig>>) {
  if (!config.allowedUserIds.includes(userId)) return null;
  const user = await User.findById(userId);
  return user && user.status !== 'invited' ? user : null;
}

export async function activeMcpConnection(id: string, config: NonNullable<ReturnType<typeof oauthConfig>>, userId?: string) {
  return McpConnection.findOne({ _id: id, clientId: config.clientId, resource: config.resource,
    ...(userId ? { userId } : {}), revokedAt: null, expiresAt: { $gt: new Date() } });
}

export function matchesSecret(actual: string, expected: string) {
  const left = Buffer.from(digest(actual));
  const right = Buffer.from(digest(expected));
  return crypto.timingSafeEqual(left, right);
}
