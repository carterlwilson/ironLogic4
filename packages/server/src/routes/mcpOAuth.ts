import { Router } from 'express';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User.js';
import { McpAuthorizationCode } from '../models/McpAuthorizationCode.js';
import { authorizationSchema, digest, issueMcpToken, matchesAuthorization, matchesSecret, mcpScope, oauthConfig } from '../mcp/oauth.js';

const router = Router();
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => `&#${character.charCodeAt(0)};`);

router.get('/.well-known/oauth-protected-resource/mcp', (_req, res) => {
  const config = oauthConfig();
  if (!config) { res.status(503).json({ error: 'MCP OAuth is not configured' }); return; }
  res.json({ resource: config.resource, authorization_servers: [config.origin], scopes_supported: [mcpScope], bearer_methods_supported: ['header'] });
});

router.get('/.well-known/oauth-authorization-server', (_req, res) => {
  const config = oauthConfig();
  if (!config) { res.status(503).json({ error: 'MCP OAuth is not configured' }); return; }
  res.json({
    issuer: config.origin,
    authorization_endpoint: `${config.origin}/oauth/authorize`, token_endpoint: `${config.origin}/oauth/token`,
    response_types_supported: ['code'], grant_types_supported: ['authorization_code'],
    code_challenge_methods_supported: ['S256'], token_endpoint_auth_methods_supported: ['client_secret_post'],
    scopes_supported: [mcpScope], authorization_response_iss_parameter_supported: true,
  });
});

// The approved user's existing JWT proves account ownership without adding password login.
router.get('/oauth/authorize', (req, res) => {
  const config = oauthConfig();
  if (!config) { res.status(503).json({ error: 'MCP OAuth is not configured' }); return; }
  const input = authorizationSchema.safeParse(req.query);
  if (!input.success || !matchesAuthorization(input.data, config)) {
    res.status(400).json({ error: 'invalid_request' }); return;
  }
  const transaction = jwt.sign({ authorization: input.data }, config.secret, {
    algorithm: 'HS256', issuer: config.origin, audience: 'mcp-link', expiresIn: '5m',
  });
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Content-Security-Policy', "default-src 'none'; form-action 'self'; frame-ancestors 'none'");
  res.type('html').send(`<!doctype html><html><head><title>Link IronLogic4</title></head><body><h1>Link IronLogic4 to ChatGPT</h1><p>This grants ChatGPT access to client lookup and schedule enrollment as the approved account. Paste your existing IronLogic4 access token to confirm. It will not be stored.</p><form method="post" action="/oauth/authorize"><input type="hidden" name="transaction" value="${escapeHtml(transaction)}"><label>IronLogic4 access token <input type="password" name="token" required autocomplete="off"></label><button type="submit">Link scheduling account</button></form></body></html>`);
});

router.post('/oauth/authorize', async (req, res) => {
  const config = oauthConfig();
  if (!config || !process.env.JWT_SECRET) { res.status(503).json({ error: 'MCP OAuth is not configured' }); return; }
  res.setHeader('Cache-Control', 'no-store');
  try {
    const transaction = jwt.verify(req.body.transaction, config.secret, { algorithms: ['HS256'], issuer: config.origin, audience: 'mcp-link' });
    const input = authorizationSchema.parse(typeof transaction === 'object' ? transaction.authorization : null);
    if (!matchesAuthorization(input, config)) throw new Error('Invalid transaction');
    const principal = jwt.verify(req.body.token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    if (typeof principal === 'string' || principal.userId !== config.userId || !await User.findById(config.userId)) {
      res.status(403).json({ error: 'Only the approved account can link scheduling' }); return;
    }
    const code = crypto.randomBytes(32).toString('base64url');
    await McpAuthorizationCode.create({
      hash: digest(code), userId: config.userId, clientId: config.clientId, redirectUri: config.redirectUri,
      challenge: input.code_challenge, resource: config.resource, expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });
    const redirect = new URL(config.redirectUri);
    redirect.searchParams.set('code', code);
    redirect.searchParams.set('state', input.state);
    redirect.searchParams.set('iss', config.origin);
    res.redirect(303, redirect.toString());
  } catch {
    res.status(400).json({ error: 'Invalid or expired linking request or access token' });
  }
});

const tokenSchema = z.object({
  grant_type: z.literal('authorization_code'), code: z.string().min(1),
  client_id: z.string(), client_secret: z.string(), redirect_uri: z.string(), resource: z.string(),
  code_verifier: z.string().regex(/^[A-Za-z0-9._~-]{43,128}$/),
});

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
  if (args.redirect_uri !== config.redirectUri || args.resource !== config.resource) {
    res.status(400).json({ error: 'invalid_grant' }); return;
  }
  try {
    const code = await McpAuthorizationCode.findOneAndDelete({
      hash: digest(args.code), clientId: args.client_id, redirectUri: args.redirect_uri,
      resource: args.resource, challenge: digest(args.code_verifier), userId: config.userId,
      expiresAt: { $gt: new Date() },
    });
    if (!code) { res.status(400).json({ error: 'invalid_grant' }); return; }
    res.json({ access_token: issueMcpToken(code.userId, config), token_type: 'Bearer', expires_in: 1800, scope: mcpScope });
  } catch {
    res.status(500).json({ error: 'server_error' });
  }
});

export default router;
