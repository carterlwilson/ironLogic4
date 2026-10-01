import assert from 'node:assert/strict';
import { test, mock } from 'node:test';
import crypto from 'node:crypto';
import express from 'express';
import jwt from 'jsonwebtoken';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { UserType } from '@ironlogic4/shared';
import { verifyToken, requireRole } from '../../src/middleware/auth.js';
import { User } from '../../src/models/User.js';
import { McpAuthorizationCode } from '../../src/models/McpAuthorizationCode.js';
import { McpConnection } from '../../src/models/McpConnection.js';
import { McpRefreshToken } from '../../src/models/McpRefreshToken.js';
import oauthRoutes from '../../src/routes/mcpOAuth.js';
import mcpRoutes from '../../src/routes/mcp.js';
import { digest, issueMcpToken, oauthConfig, verifyMcpToken } from '../../src/mcp/oauth.js';

let fixtureNumber = 0;
async function fixture() {
  const previous = { ...process.env };
  Object.assign(process.env, {
    MCP_PUBLIC_ORIGIN: 'https://backend.example', MCP_APPROVED_USER_ID: 'approved-user',
    MCP_ALLOWED_USER_IDS: 'approved-user, second-user',
    MCP_OAUTH_SECRET: crypto.randomBytes(32).toString('hex'), MCP_OAUTH_CLIENT_ID: 'chatgpt-test',
    MCP_OAUTH_CLIENT_SECRET: 'oauth-test-secret', MCP_OAUTH_REDIRECT_URI: 'https://chatgpt.com/test-callback',
    JWT_SECRET: crypto.randomBytes(32).toString('hex'),
  });
  const config = oauthConfig()!;
  const user = (id: string, email: string, userType: UserType) => ({ id, email, userType, status: 'active', refreshTokens: [],
    comparePassword: async (password: string) => password === 'TestPassword123!',
  });
  const users: any[] = [user('approved-user', 'owner@example.com', UserType.OWNER), user('second-user', 'member@example.com', UserType.CLIENT), user('denied-user', 'denied@example.com', UserType.OWNER)];
  const codes: any[] = [], connections: any[] = [], tokens: any[] = [];
  const mocks: any[] = [];
  let failTokenCreate = false;
  let failConnectionRead = false;
  const matches = (record: any, filter: any) => Object.entries(filter).every(([key, value]: [string, any]) => {
    if (value && typeof value === 'object' && '$gt' in value) return record[key] > value.$gt;
    if (value && typeof value === 'object' && '$in' in value) return value.$in.includes(record[key]);
    return value === null ? record[key] == null : String(record[key]) === String(value);
  });
  const method = (model: any, name: string, fn: any) => mocks.push(mock.method(model, name, fn));
  method(User, 'findById', async (id: string) => users.find(user => user.id === id) || null);
  method(User, 'findOne', (filter: any) => ({ select: async () => users.find(user => user.email === filter.email) || null }));
  const create = (records: any[]) => async (record: any) => {
    const id = crypto.randomBytes(12).toString('hex');
    const document = { id, _id: id, revokedAt: null, consumedAt: null, ...record };
    records.push(document); return document;
  };
  method(McpAuthorizationCode, 'create', create(codes));
  method(McpAuthorizationCode, 'findOneAndDelete', async (filter: any) => {
    const index = codes.findIndex(record => matches(record, filter));
    return index < 0 ? null : codes.splice(index, 1)[0];
  });
  method(McpConnection, 'create', create(connections));
  method(McpConnection, 'findOne', async (filter: any) => {
    if (failConnectionRead) throw new Error('Database unavailable');
    return connections.find(record => matches(record, filter)) || null;
  });
  method(McpConnection, 'updateOne', async (filter: any, update: any) => {
    const record = connections.find(record => matches(record, filter));
    if (record) Object.assign(record, update.$set);
    return { modifiedCount: record ? 1 : 0 };
  });
  method(McpRefreshToken, 'create', async (record: any) => {
    if (failTokenCreate) throw new Error('Database unavailable');
    return create(tokens)(record);
  });
  method(McpRefreshToken, 'findOne', async (filter: any) => tokens.find(record => matches(record, filter)) || null);
  method(McpRefreshToken, 'findOneAndUpdate', async (filter: any, update: any) => {
    const record = tokens.find(record => matches(record, filter));
    if (!record) return null;
    const original = { ...record };
    Object.assign(record, update.$set); return original;
  });
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json(), express.urlencoded({ extended: false }));
  app.use(oauthRoutes);
  app.use('/mcp', mcpRoutes);
  app.get('/api/gym/clients', verifyToken, (req: any, res) => res.json({ success: true, data: [{ id: req.user.id }] }));
  app.post('/api/gym/schedules/active/:id/timeslots/:timeslotId/clients', verifyToken, requireRole([UserType.OWNER]), (_req, res) => res.json({ success: true }));
  const http = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => http.once('listening', resolve));
  const port = (http.address() as { port: number }).port;
  process.env.PORT = String(port);
  const base = `http://127.0.0.1:${port}`;
  const ip = `192.0.2.${++fixtureNumber}`;
  const post = (path: string, body: Record<string, string>, headers: Record<string, string> = {}) => fetch(`${base}${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'x-forwarded-for': ip, ...headers },
    body: new URLSearchParams(body), redirect: 'manual',
  });
  async function start(scope = 'scheduling offline_access', overrides: Record<string, string> = {}) {
    const verifier = crypto.randomBytes(32).toString('base64url');
    const authorization = {
      response_type: 'code', client_id: config.clientId, redirect_uri: config.redirectUri,
      resource: config.resource, scope, state: 'original-state',
      code_challenge: digest(verifier), code_challenge_method: 'S256', ...overrides,
    };
    const page = await fetch(`${base}/oauth/authorize?${new URLSearchParams(authorization)}`);
    const html = await page.text();
    return { page, html, verifier, transaction: html.match(/name="transaction" value="([^"]+)"/)?.[1] || '', cookie: page.headers.get('set-cookie')?.split(';')[0] || '' };
  }
  const credentials = { email: 'owner@example.com', password: 'TestPassword123!', consent: 'yes' };
  const submit = (flow: Awaited<ReturnType<typeof start>>, changes = {}, headers = {}) => post('/oauth/authorize', { transaction: flow.transaction, ...credentials, ...changes }, { cookie: flow.cookie, Origin: config.origin, ...headers });
  const exchangeArgs = (code: string, verifier: string) => ({ grant_type: 'authorization_code', code, client_id: config.clientId, client_secret: config.clientSecret, redirect_uri: config.redirectUri, resource: config.resource, code_verifier: verifier });
  async function link(scope = 'scheduling offline_access', changes = {}) {
    const flow = await start(scope);
    const linked = await submit(flow, changes);
    assert.equal(linked.status, 303);
    const redirect = new URL(linked.headers.get('location')!);
    assert.equal(redirect.searchParams.get('state'), 'original-state');
    assert.equal(redirect.searchParams.get('iss'), config.origin);
    assert.match(linked.headers.get('set-cookie')!, /Expires=Thu, 01 Jan 1970/);
    const args = exchangeArgs(redirect.searchParams.get('code')!, flow.verifier);
    const response = await post('/oauth/token', args);
    assert.equal(response.status, 200);
    return { body: await response.json(), args, flow };
  }
  const refresh = (token: string, changes = {}) => post('/oauth/token', { grant_type: 'refresh_token', client_id: config.clientId, client_secret: config.clientSecret, resource: config.resource, refresh_token: token, ...changes });
  const mcp = (token: string) => fetch(`${base}/mcp`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }) });
  return { config, users, codes, connections, tokens, base, start, submit, link, post, refresh, mcp, exchangeArgs,
    failTokens: () => { failTokenCreate = true; }, failReads: () => { failConnectionRead = true; },
    close: async () => {
      mocks.forEach(value => value.mock.restore());
      await new Promise<void>((resolve, reject) => http.close(error => error ? reject(error) : resolve()));
      for (const key of Object.keys(process.env)) if (!(key in previous)) delete process.env[key];
      Object.assign(process.env, previous);
    },
  };
}

async function using(fn: (f: Awaited<ReturnType<typeof fixture>>) => Promise<void>) {
  const f = await fixture();
  try { await fn(f); } finally { await f.close(); }
}

test('allowlist configuration precedence, fallback and fail-closed empty list', () => using(async f => {
  assert.deepEqual(f.config.allowedUserIds, ['approved-user', 'second-user']);
  delete process.env.MCP_ALLOWED_USER_IDS;
  assert.deepEqual(oauthConfig()!.allowedUserIds, ['approved-user']);
  process.env.MCP_ALLOWED_USER_IDS = ' , ';
  assert.equal(oauthConfig(), null);
  assert.equal((await fetch(`${f.base}/.well-known/oauth-authorization-server`)).status, 503);
}));

test('discovery advertises refresh and login form binds the browser without exposing credentials', () => using(async f => {
  const discovery = await (await fetch(`${f.base}/.well-known/oauth-authorization-server`)).json();
  assert.deepEqual(discovery.grant_types_supported, ['authorization_code', 'refresh_token']);
  assert.deepEqual(discovery.scopes_supported, ['scheduling', 'offline_access']);
  const metadata = await (await fetch(`${f.base}/.well-known/oauth-protected-resource/mcp`)).json();
  assert.equal(metadata.resource, f.config.resource);
  const flow = await f.start();
  assert.match(flow.html, /name="email"/); assert.match(flow.html, /365 days/);
  assert.match(flow.page.headers.get('set-cookie')!, /HttpOnly/);
  assert.match(flow.page.headers.get('set-cookie')!, /Secure/);
  assert.match(flow.page.headers.get('set-cookie')!, /SameSite=Lax/);
  assert.equal(flow.page.headers.get('cache-control'), 'no-store');
  assert.doesNotMatch(flow.html, /name="token"/);
  assert.equal((await f.start('scheduling other')).page.status, 400);
  assert.equal((await f.start('offline_access')).page.status, 400);
  assert.equal((await f.start('scheduling', { redirect_uri: 'https://attacker.example' })).page.status, 400);
  assert.equal((await f.submit(flow, {}, { cookie: '' })).status, 400);
  assert.equal((await f.submit(flow, {}, { Origin: 'https://attacker.example' })).status, 400);
  assert.equal((await f.submit(flow, {}, { 'sec-fetch-site': 'cross-site' })).status, 400);
  const other = await f.start();
  assert.equal((await f.submit(flow, {}, { cookie: other.cookie })).status, 400);
  const expired = jwt.sign({ authorization: (jwt.decode(flow.transaction) as any).authorization, nonceHash: digest(flow.cookie.split('=')[1]), exp: 1 }, f.config.secret, { issuer: f.config.origin, audience: 'mcp-link' });
  assert.equal((await f.submit({ ...flow, transaction: expired })).status, 400);
  assert.equal(f.codes.length, 0);
}));

test('credentials, account eligibility and consent are enforced with retry and no application tokens', () => using(async f => {
  const flow = await f.start();
  const responses = [];
  for (const changes of [{ password: 'WrongPassword' }, { email: 'absent@example.com' }, { email: 'denied@example.com' }]) {
    const response = await f.submit(flow, changes);
    assert.equal(response.status, 401);
    const html = await response.text();
    assert.doesNotMatch(html, /WrongPassword|TestPassword123!/);
    responses.push(html);
  }
  assert.equal(responses[0], responses[1]); assert.equal(responses[1], responses[2]);
  f.users[0].status = 'invited';
  assert.equal((await f.submit(flow)).status, 401);
  f.users[0].status = 'active';
  assert.equal((await f.submit(flow, { consent: '' })).status, 400);
  assert.equal(f.codes.length, 0);
  assert.equal((await f.submit(flow)).status, 303);
  assert.deepEqual(f.users.map(user => user.refreshTokens), [[], [], []]);
  assert.doesNotMatch(JSON.stringify(f.codes), /TestPassword123!/);
}));

test('OAuth login limits attempts to ten per IP', () => using(async f => {
  const flow = await f.start();
  for (let index = 0; index < 10; index++) assert.equal((await f.submit(flow, { password: 'WrongPassword' })).status, 401);
  assert.equal((await f.submit(flow)).status, 429);
}));

test('PKCE and code bindings, single-use codes, and short-lived scopes', () => using(async f => {
  const flow = await f.start('scheduling');
  const linked = await f.submit(flow);
  const code = new URL(linked.headers.get('location')!).searchParams.get('code')!;
  const args = f.exchangeArgs(code, flow.verifier);
  assert.equal(f.codes[0].hash, digest(code));
  for (const change of [{ client_secret: 'wrong' }, { resource: 'https://other.example/mcp' }, { redirect_uri: 'https://attacker.example' }, { code_verifier: 'a'.repeat(43) }]) {
    assert.ok((await f.post('/oauth/token', { ...args, ...change })).status >= 400);
  }
  assert.equal(f.codes.length, 1);
  const exchanged = await f.post('/oauth/token', args);
  assert.equal(exchanged.status, 200);
  const body = await exchanged.json();
  assert.equal(body.refresh_token, undefined);
  assert.equal(body.expires_in, 1800);
  assert.equal(verifyMcpToken(body.access_token, f.config).userId, 'approved-user');
  assert.equal((await f.post('/oauth/token', args)).status, 400);
  assert.equal(f.tokens.length, 0);
  const expiredFlow = await f.start();
  const expiredLink = await f.submit(expiredFlow);
  f.codes[0].expiresAt = new Date(0);
  const expiredCode = new URL(expiredLink.headers.get('location')!).searchParams.get('code')!;
  assert.equal((await f.post('/oauth/token', f.exchangeArgs(expiredCode, expiredFlow.verifier))).status, 400);
}));

test('account deletion, invitation and allowlist removal are checked again at code exchange', () => using(async f => {
  for (const state of ['deleted', 'invited', 'removed']) {
    const flow = await f.start();
    const linked = await f.submit(flow);
    const code = new URL(linked.headers.get('location')!).searchParams.get('code')!;
    const user = f.users[0];
    if (state === 'deleted') f.users.shift();
    if (state === 'invited') user.status = 'invited';
    if (state === 'removed') process.env.MCP_ALLOWED_USER_IDS = 'second-user';
    assert.equal((await f.post('/oauth/token', f.exchangeArgs(code, flow.verifier))).status, 400);
    if (state === 'deleted') f.users.unshift(user);
    user.status = 'active'; process.env.MCP_ALLOWED_USER_IDS = 'approved-user,second-user';
  }
}));

test('refresh rotation preserves the fixed year, rejects bindings, and replay revokes access', () => using(async f => {
  const before = Date.now();
  const { body } = await f.link();
  const expiry = f.connections[0].expiresAt.getTime();
  assert.ok(expiry >= before + 365 * 86400000 && expiry <= Date.now() + 365 * 86400000);
  assert.equal(body.expires_in, 1800);
  assert.equal((await f.mcp(body.access_token)).status, 200);
  assert.equal(f.tokens[0].hash, digest(body.refresh_token));
  assert.doesNotMatch(JSON.stringify(f.tokens), new RegExp(body.refresh_token));
  for (const change of [{ client_secret: 'wrong' }, { client_id: 'wrong' }, { resource: 'https://wrong.example/mcp' }, { scope: 'scheduling' }]) {
    assert.ok((await f.refresh(body.refresh_token, change)).status >= 400);
  }
  assert.equal(f.tokens[0].consumedAt, null);
  const response = await f.refresh(body.refresh_token);
  assert.equal(response.status, 200);
  const next = await response.json();
  assert.notEqual(next.refresh_token, body.refresh_token);
  assert.ok(f.tokens[0].consumedAt);
  assert.equal(f.tokens[1].expiresAt.getTime(), expiry);
  assert.equal(f.connections[0].expiresAt.getTime(), expiry);
  assert.equal((await f.mcp(next.access_token)).status, 200);
  assert.equal((await f.refresh(body.refresh_token)).status, 400);
  assert.ok(f.connections[0].revokedAt);
  assert.equal((await f.refresh(next.refresh_token)).status, 400);
  assert.equal((await f.mcp(next.access_token)).status, 401);
}));

test('concurrent refresh cannot produce two valid connections', () => using(async f => {
  const { body } = await f.link();
  const responses = await Promise.all([f.refresh(body.refresh_token), f.refresh(body.refresh_token)]);
  assert.ok(responses.some(response => response.status === 400));
  assert.ok(f.connections[0].revokedAt);
  assert.equal((await f.mcp(body.access_token)).status, 401);
}));

test('refresh restores access after a 30-minute token expires without another login', () => using(async f => {
  const { body } = await f.link();
  const claims = jwt.decode(body.access_token) as jwt.JwtPayload;
  const expired = jwt.sign({ ...claims, exp: Math.floor(Date.now() / 1000) - 1 }, f.config.secret);
  assert.equal((await f.mcp(expired)).status, 401);
  const codeCount = f.codes.length;
  const refreshed = await f.refresh(body.refresh_token);
  assert.equal(refreshed.status, 200);
  const next = await refreshed.json();
  assert.equal((await f.mcp(next.access_token)).status, 200);
  assert.equal(f.codes.length, codeCount);
  assert.equal(f.connections.length, 1);
  assert.deepEqual(f.users.map(user => user.refreshTokens), [[], [], []]);
}));

test('expiry and account eligibility block refresh and access independent of TTL cleanup', () => using(async f => {
  const { body } = await f.link();
  const connection = f.connections[0];
  connection.expiresAt = new Date(Date.now() + 2000);
  const capped = issueMcpToken('approved-user', f.config, connection);
  assert.equal((jwt.decode(capped) as any).exp, Math.floor(connection.expiresAt.getTime() / 1000));
  for (const state of ['expired', 'invited', 'removed', 'deleted']) {
    const expiry = connection.expiresAt;
    const user = f.users[0];
    if (state === 'expired') connection.expiresAt = new Date(0);
    if (state === 'invited') user.status = 'invited';
    if (state === 'removed') process.env.MCP_ALLOWED_USER_IDS = 'second-user';
    if (state === 'deleted') f.users.shift();
    assert.equal((await f.refresh(body.refresh_token)).status, 400);
    assert.equal((await f.mcp(body.access_token)).status, 401);
    connection.expiresAt = expiry; user.status = 'active';
    process.env.MCP_ALLOWED_USER_IDS = 'approved-user,second-user';
    if (state === 'deleted') f.users.unshift(user);
  }
  f.tokens[0].expiresAt = new Date(0);
  assert.equal((await f.refresh(body.refresh_token)).status, 400);
}));

test('persistence failures fail closed and revoke partially issued connections', () => using(async f => {
  const { body } = await f.link();
  f.failTokens();
  const failed = await f.refresh(body.refresh_token);
  assert.equal(failed.status, 500);
  assert.deepEqual(await failed.json(), { error: 'server_error' });
  assert.ok(f.connections[0].revokedAt);
  assert.equal((await f.mcp(body.access_token)).status, 401);
  f.failReads();
  assert.equal((await f.mcp(body.access_token)).status, 401);
}));

test('initial refresh-token persistence failure returns no credentials and revokes the new connection', () => using(async f => {
  const flow = await f.start();
  const linked = await f.submit(flow);
  const code = new URL(linked.headers.get('location')!).searchParams.get('code')!;
  f.failTokens();
  const response = await f.post('/oauth/token', f.exchangeArgs(code, flow.verifier));
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: 'server_error' });
  assert.ok(f.connections[0].revokedAt);
}));

test('two linked users keep separate identities and backend roles over HTTP MCP', () => using(async f => {
  const owner = await f.link();
  const member = await f.link('scheduling offline_access', { email: 'member@example.com' });
  assert.notEqual((jwt.decode(owner.body.access_token) as any).connectionId, (jwt.decode(member.body.access_token) as any).connectionId);
  for (const [linked, userId, denied] of [[owner, 'approved-user', false], [member, 'second-user', true]] as const) {
    const client = new Client({ name: 'http-test', version: '1' });
    try {
      await client.connect(new StreamableHTTPClientTransport(new URL(`${f.base}/mcp`), { requestInit: { headers: { Authorization: `Bearer ${linked.body.access_token}` } } }));
      assert.equal((await client.listTools()).tools.length, 7);
      const lookup = await client.callTool({ name: 'searchClients', arguments: {} });
      assert.deepEqual(lookup.structuredContent, { success: true, data: [{ id: userId }] });
      const write = await client.callTool({ name: 'addClientToActiveTimeslot', arguments: { id: 'active-id', timeslotId: 'slot-id', clientId: 'client-id' } });
      assert.equal(write.isError, denied);
    } finally { await client.close(); }
  }
  const removedMember = f.users.splice(1, 1)[0];
  assert.equal((await f.mcp(owner.body.access_token)).status, 200);
  assert.equal((await f.mcp(member.body.access_token)).status, 401);
  f.users.splice(1, 0, removedMember);
}));

test('legacy tokens survive until expiry but remain allowlisted; invalid token claims fail', () => using(async f => {
  const legacy = issueMcpToken('approved-user', f.config);
  assert.equal((await f.mcp(legacy)).status, 200);
  assert.equal((jwt.decode(legacy) as any).connectionId, undefined);
  const appToken = jwt.sign({ userId: 'approved-user' }, process.env.JWT_SECRET!, { expiresIn: '1h' });
  assert.throws(() => verifyMcpToken(appToken, f.config));
  assert.throws(() => verifyMcpToken(issueMcpToken('denied-user', f.config), f.config));
  for (const claims of [{ aud: 'https://other.example/mcp' }, { iss: 'https://other.example' }, { scope: 'other' }, { exp: 1 }, { connectionId: '' }]) {
    const forged = jwt.sign({ sub: 'approved-user', iss: f.config.origin, aud: f.config.resource, scope: 'scheduling', exp: Math.floor(Date.now() / 1000) + 60, ...claims }, f.config.secret);
    assert.throws(() => verifyMcpToken(forged, f.config));
  }
  process.env.MCP_ALLOWED_USER_IDS = 'second-user';
  assert.equal((await f.mcp(legacy)).status, 401);
  const missing = await fetch(`${f.base}/mcp`, { method: 'POST' });
  assert.equal(missing.status, 401); assert.match(missing.headers.get('www-authenticate')!, /resource_metadata=/);
}));
