import { Router, Response } from 'express';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { LoginSchema } from '@ironlogic4/shared/schemas/auth';
import { User } from '../models/User.js';
import { McpAuthorizationCode } from '../models/McpAuthorizationCode.js';
import { McpConnection } from '../models/McpConnection.js';
import { McpRefreshToken } from '../models/McpRefreshToken.js';
import { activeMcpConnection, authorizationSchema, digest, eligibleMcpUser, issueMcpToken, matchesAuthorization, matchesSecret, mcpScope, oauthConfig, scopeSchema } from '../mcp/oauth.js';

const router = Router();
const nonceCookie = '__Host-mcp-link';
const cookieOptions = { secure: true, httpOnly: true, sameSite: 'lax' as const, path: '/' };
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => `&#${character.charCodeAt(0)};`);
const scopes = [mcpScope, 'offline_access'];
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 10,
  message: { error: 'Too many linking attempts. Please try again later.' },
});

function linkingPage(res: Response, transaction: string, persistent: boolean, error = '') {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Content-Security-Policy', "default-src 'none'; form-action 'self'; frame-ancestors 'none'");
  res.type('html').send(`<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>Link IronLogic4</title></head><body><h1>Link IronLogic4 to ChatGPT</h1><p>Sign in with your IronLogic4 email and password. ChatGPT will use your existing permissions to look up clients and manage schedule enrollment.</p>${persistent ? '<p>Allow ChatGPT to stay connected for up to 365 days without signing in again.</p>' : ''}${error ? `<p role="alert">${escapeHtml(error)}</p>` : ''}<form method="post" action="/oauth/authorize"><input type="hidden" name="transaction" value="${escapeHtml(transaction)}"><p><label>Email <input type="email" name="email" required autocomplete="username"></label></p><p><label>Password <input type="password" name="password" required autocomplete="current-password"></label></p><p><label><input type="checkbox" name="consent" value="yes" required> I authorize scheduling access${persistent ? ' and a connection lasting up to 365 days' : ''}.</label></p><button type="submit">Sign in and link scheduling</button></form></body></html>`);
}

router.get('/.well-known/oauth-protected-resource/mcp', (_req, res) => {
  const config = oauthConfig();
  if (!config) { res.status(503).json({ error: 'MCP OAuth is not configured' }); return; }
  res.json({ resource: config.resource, authorization_servers: [config.origin], scopes_supported: scopes, bearer_methods_supported: ['header'] });
});

router.get('/.well-known/oauth-authorization-server', (_req, res) => {
  const config = oauthConfig();
  if (!config) { res.status(503).json({ error: 'MCP OAuth is not configured' }); return; }
  res.json({
    issuer: config.origin,
    authorization_endpoint: `${config.origin}/oauth/authorize`, token_endpoint: `${config.origin}/oauth/token`,
    response_types_supported: ['code'], grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256'], token_endpoint_auth_methods_supported: ['client_secret_post'],
    scopes_supported: scopes, authorization_response_iss_parameter_supported: true,
  });
});

router.get('/oauth/authorize', (req, res) => {
  const config = oauthConfig();
  if (!config) { res.status(503).json({ error: 'MCP OAuth is not configured' }); return; }
  const input = authorizationSchema.safeParse(req.query);
  if (!input.success || !matchesAuthorization(input.data, config)) {
    res.status(400).json({ error: 'invalid_request' }); return;
  }
  const nonce = crypto.randomBytes(32).toString('base64url');
  const transaction = jwt.sign({ authorization: input.data, nonceHash: digest(nonce) }, config.secret, {
    algorithm: 'HS256', issuer: config.origin, audience: 'mcp-link', expiresIn: '5m',
  });
  res.cookie(nonceCookie, nonce, { ...cookieOptions, maxAge: 5 * 60 * 1000 });
  linkingPage(res, transaction, input.data.scope.includes('offline_access'));
});

router.post('/oauth/authorize', loginLimiter, async (req, res) => {
  const config = oauthConfig();
  if (!config) { res.status(503).json({ error: 'MCP OAuth is not configured' }); return; }
  res.setHeader('Cache-Control', 'no-store');
  let input: z.infer<typeof authorizationSchema>;
  try {
    if (req.headers.origin && req.headers.origin !== config.origin) throw new Error('Invalid origin');
    if (req.headers['sec-fetch-site'] === 'cross-site') throw new Error('Cross-origin submission');
    const transaction = jwt.verify(req.body.transaction, config.secret, { algorithms: ['HS256'], issuer: config.origin, audience: 'mcp-link' });
    if (typeof transaction !== 'object') throw new Error('Invalid transaction');
    input = authorizationSchema.parse(transaction.authorization);
    const nonce = req.headers.cookie?.split(';').map(value => value.trim()).find(value => value.startsWith(`${nonceCookie}=`))?.slice(nonceCookie.length + 1);
    if (!nonce || typeof transaction.nonceHash !== 'string' || !matchesSecret(digest(nonce), transaction.nonceHash) || !matchesAuthorization(input, config)) {
      throw new Error('Invalid browser binding');
    }
  } catch {
    res.status(400).json({ error: 'Invalid or expired linking request. Start linking again.' }); return;
  }
  const persistent = input.scope.includes('offline_access');
  const credentials = LoginSchema.safeParse(req.body);
  if (!credentials.success || req.body.consent !== 'yes') {
    linkingPage(res.status(400), req.body.transaction, persistent, 'Enter your email and password and authorize scheduling access.'); return;
  }
  try {
    const user = await User.findOne({ email: credentials.data.email }).select('+password');
    if (!user || !await user.comparePassword(credentials.data.password) || user.status === 'invited' || !config.allowedUserIds.includes(user.id)) {
      linkingPage(res.status(401), req.body.transaction, persistent, 'Unable to link with these credentials.'); return;
    }
    const code = crypto.randomBytes(32).toString('base64url');
    await McpAuthorizationCode.create({
      hash: digest(code), userId: user.id, clientId: config.clientId, redirectUri: config.redirectUri,
      challenge: input.code_challenge, resource: config.resource, scope: input.scope,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });
    const redirect = new URL(config.redirectUri);
    redirect.searchParams.set('code', code);
    redirect.searchParams.set('state', input.state);
    redirect.searchParams.set('iss', config.origin);
    res.clearCookie(nonceCookie, cookieOptions);
    res.redirect(303, redirect.toString());
  } catch {
    linkingPage(res.status(500), req.body.transaction, persistent, 'Unable to complete linking. Please try again.');
  }
});

const clientFields = { client_id: z.string(), client_secret: z.string(), resource: z.string() };
const tokenSchema = z.discriminatedUnion('grant_type', [
  z.object({ ...clientFields, grant_type: z.literal('authorization_code'), code: z.string().min(1), redirect_uri: z.string(), code_verifier: z.string().regex(/^[A-Za-z0-9._~-]{43,128}$/) }),
  z.object({ ...clientFields, grant_type: z.literal('refresh_token'), refresh_token: z.string().min(1), scope: scopeSchema.optional() }),
]);

async function newRefreshToken(connectionId: string, expiresAt: Date) {
  const token = crypto.randomBytes(64).toString('base64url');
  await McpRefreshToken.create({ hash: digest(token), connectionId, expiresAt });
  return token;
}

router.post('/oauth/token', async (req, res) => {
  const config = oauthConfig();
  if (!config) { res.status(503).json({ error: 'MCP OAuth is not configured' }); return; }
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  const input = tokenSchema.safeParse(req.body);
  if (!input.success) { res.status(400).json({ error: 'invalid_request' }); return; }
  const args = input.data;
  if (args.client_id !== config.clientId || !matchesSecret(args.client_secret, config.clientSecret)) {
    res.status(401).json({ error: 'invalid_client' }); return;
  }
  if (args.resource !== config.resource || (args.grant_type === 'authorization_code' && args.redirect_uri !== config.redirectUri)) {
    res.status(400).json({ error: 'invalid_grant' }); return;
  }
  let connectionId: string | undefined;
  try {
    let connection;
    if (args.grant_type === 'authorization_code') {
      const code = await McpAuthorizationCode.findOneAndDelete({
        hash: digest(args.code), clientId: args.client_id, redirectUri: args.redirect_uri,
        resource: args.resource, challenge: digest(args.code_verifier), userId: { $in: config.allowedUserIds },
        expiresAt: { $gt: new Date() },
      });
      if (!code || !await eligibleMcpUser(code.userId, config)) { res.status(400).json({ error: 'invalid_grant' }); return; }
      const scope = scopeSchema.parse(code.scope);
      const persistent = scope.includes('offline_access');
      connection = await McpConnection.create({
        userId: code.userId, clientId: config.clientId, resource: config.resource, scope,
        expiresAt: new Date(Date.now() + (persistent ? 365 * 24 * 60 * 60 : 1800) * 1000),
      });
      connectionId = connection.id;
    } else {
      const token = await McpRefreshToken.findOne({ hash: digest(args.refresh_token), expiresAt: { $gt: new Date() } });
      if (!token) { res.status(400).json({ error: 'invalid_grant' }); return; }
      connection = await activeMcpConnection(token.connectionId, config);
      if (!connection || !await eligibleMcpUser(connection.userId, config) || !connection.scope.includes('offline_access') || (args.scope && args.scope !== connection.scope)) {
        res.status(400).json({ error: 'invalid_grant' }); return;
      }
      connectionId = connection.id;
      const consumed = await McpRefreshToken.findOneAndUpdate({ _id: token._id, consumedAt: null, expiresAt: { $gt: new Date() } }, { $set: { consumedAt: new Date() } });
      if (!consumed) {
        await McpConnection.updateOne({ _id: connectionId }, { $set: { revokedAt: new Date() } });
        res.status(400).json({ error: 'invalid_grant' }); return;
      }
    }
    const refreshToken = connection.scope.includes('offline_access') ? await newRefreshToken(connection.id, connection.expiresAt) : undefined;
    // Recheck after rotation: a concurrent replay may have revoked the connection.
    if (!await activeMcpConnection(connection.id, config, connection.userId)) {
      res.status(400).json({ error: 'invalid_grant' }); return;
    }
    const accessToken = issueMcpToken(connection.userId, config, {
      id: connection._id.toString(), scope: connection.scope, expiresAt: connection.expiresAt,
    });
    const expiresIn = (jwt.decode(accessToken) as jwt.JwtPayload).exp! - Math.floor(Date.now() / 1000);
    res.json({ access_token: accessToken, token_type: 'Bearer', expires_in: expiresIn, scope: connection.scope,
      ...(refreshToken ? { refresh_token: refreshToken } : {}) });
  } catch {
    if (connectionId) {
      try { await McpConnection.updateOne({ _id: connectionId }, { $set: { revokedAt: new Date() } }); } catch { /* Database failures also prevent access checks. */ }
    }
    res.status(500).json({ error: 'server_error' });
  }
});

export default router;
