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
import oauthRoutes from '../../src/routes/mcpOAuth.js';
import mcpRoutes from '../../src/routes/mcp.js';
import { digest, issueMcpToken, oauthConfig, verifyMcpToken } from '../../src/mcp/oauth.js';

test('OAuth links only the approved account with bound, single-use PKCE codes', async () => {
  const previous = { ...process.env };
  Object.assign(process.env, {
    MCP_PUBLIC_ORIGIN: 'https://backend.example', MCP_APPROVED_USER_ID: 'approved-user',
    MCP_OAUTH_SECRET: crypto.randomBytes(32).toString('hex'), MCP_OAUTH_CLIENT_ID: 'chatgpt-test',
    MCP_OAUTH_CLIENT_SECRET: 'oauth-test-secret', MCP_OAUTH_REDIRECT_URI: 'https://chatgpt.com/test-callback',
    JWT_SECRET: crypto.randomBytes(32).toString('hex'),
  });
  const config = oauthConfig()!;
  const records: Record<string, any>[] = [];
  const findUser = mock.method(User, 'findById', async () => ({ id: 'approved-user', userType: UserType.CLIENT }));
  const create = mock.method(McpAuthorizationCode, 'create', async (record: any) => { records.push(record); return record; });
  const consume = mock.method(McpAuthorizationCode, 'findOneAndDelete', async (filter: any) => {
    const index = records.findIndex(record => Object.entries(filter).every(([key, value]) =>
      key === 'expiresAt' ? record.expiresAt > (value as any).$gt : record[key] === value));
    return index < 0 ? null : records.splice(index, 1)[0];
  });
  const app = express();
  app.use(express.json(), express.urlencoded({ extended: false }));
  app.use(oauthRoutes);
  app.use('/mcp', mcpRoutes);
  app.get('/api/gym/clients', verifyToken, (_req, res) => res.json({ success: true, data: [{ id: 'client-id' }] }));
  app.post('/api/gym/schedules/active/:id/timeslots/:timeslotId/clients', verifyToken, requireRole([UserType.OWNER]), (_req, res) => res.json({ success: true }));
  const http = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => http.once('listening', resolve));
  const port = (http.address() as { port: number }).port;
  process.env.PORT = String(port);
  const base = `http://127.0.0.1:${port}`;
  const verifier = crypto.randomBytes(32).toString('base64url');
  const authorization = {
    response_type: 'code', client_id: config.clientId, redirect_uri: config.redirectUri,
    resource: config.resource, scope: 'scheduling', state: 'original-state',
    code_challenge: digest(verifier), code_challenge_method: 'S256',
  };
  const post = (path: string, body: Record<string, string>) => fetch(`${base}${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body), redirect: 'manual',
  });
  try {
    const metadata = await (await fetch(`${base}/.well-known/oauth-protected-resource/mcp`)).json();
    assert.equal(metadata.resource, config.resource);
    const discovery = await (await fetch(`${base}/.well-known/oauth-authorization-server`)).json();
    assert.deepEqual(discovery.code_challenge_methods_supported, ['S256']);
    assert.deepEqual(discovery.grant_types_supported, ['authorization_code']);
    const unauthorized = await fetch(`${base}/mcp`, { method: 'POST' });
    assert.equal(unauthorized.status, 401);
    assert.match(unauthorized.headers.get('www-authenticate')!, /resource_metadata=/);
    const invalid = await fetch(`${base}/oauth/authorize?${new URLSearchParams({ ...authorization, redirect_uri: 'https://attacker.example' })}`);
    assert.equal(invalid.status, 400);
    assert.equal(invalid.headers.get('location'), null);
    const page = await fetch(`${base}/oauth/authorize?${new URLSearchParams(authorization)}`);
    assert.equal(page.headers.get('cache-control'), 'no-store');
    const html = await page.text();
    const transaction = html.match(/name="transaction" value="([^"]+)"/)![1];
    const otherUserToken = jwt.sign({ userId: 'other-user' }, process.env.JWT_SECRET!, { expiresIn: '1h' });
    assert.equal((await post('/oauth/authorize', { transaction, token: otherUserToken })).status, 403);
    assert.equal(records.length, 0);
    const linkingToken = jwt.sign({ userId: config.userId }, process.env.JWT_SECRET!, { expiresIn: '1h' });
    const linked = await post('/oauth/authorize', { transaction, token: linkingToken });
    assert.equal(linked.status, 303);
    const redirect = new URL(linked.headers.get('location')!);
    assert.equal(redirect.searchParams.get('state'), authorization.state);
    assert.equal(redirect.searchParams.get('iss'), config.origin);
    const code = redirect.searchParams.get('code')!;
    assert.equal(records[0].hash, digest(code));
    assert.doesNotMatch(JSON.stringify(records), new RegExp(linkingToken));
    const exchange = {
      grant_type: 'authorization_code', code, client_id: config.clientId, client_secret: config.clientSecret,
      redirect_uri: config.redirectUri, resource: config.resource, code_verifier: verifier,
    };
    for (const change of [
      { client_secret: 'wrong' }, { redirect_uri: 'https://attacker.example' },
      { resource: 'https://other.example/mcp' }, { code_verifier: 'a'.repeat(43) },
    ]) assert.ok((await post('/oauth/token', { ...exchange, ...change })).status >= 400);
    assert.equal(records.length, 1);
    const exchanged = await post('/oauth/token', exchange);
    assert.equal(exchanged.status, 200);
    const body = await exchanged.json();
    assert.equal(verifyMcpToken(body.access_token, config), config.userId);
    assert.equal((jwt.decode(body.access_token) as any).userId, undefined);
    assert.equal((await post('/oauth/token', exchange)).status, 400);
    // Expiration is checked explicitly, even before MongoDB's TTL cleanup runs.
    const expiredLink = await post('/oauth/authorize', { transaction, token: linkingToken });
    const expiredCode = new URL(expiredLink.headers.get('location')!).searchParams.get('code')!;
    records[0].expiresAt = new Date(0);
    assert.equal((await post('/oauth/token', { ...exchange, code: expiredCode })).status, 400);
    const client = new Client({ name: 'http-test', version: '1' });
    try {
      await client.connect(new StreamableHTTPClientTransport(new URL(`${base}/mcp`), {
        requestInit: { headers: { Authorization: `Bearer ${body.access_token}` } },
      }));
      assert.equal((await client.listTools()).tools.length, 7);
      const lookup = await client.callTool({ name: 'searchClients', arguments: { search: 'Ann' } });
      assert.deepEqual(lookup.structuredContent, { success: true, data: [{ id: 'client-id' }] });
      const denied = await client.callTool({ name: 'addClientToActiveTimeslot', arguments: { id: 'active-id', timeslotId: 'slot-id', clientId: 'client-id' } });
      assert.equal(denied.isError, true);
      assert.deepEqual(denied.structuredContent, { success: false, error: 'Insufficient permissions' });
    } finally { await client.close(); }
    assert.throws(() => verifyMcpToken(linkingToken, config));
    assert.throws(() => verifyMcpToken(issueMcpToken('other-user', config), config));
    for (const claims of [
      { aud: 'https://other.example/mcp' }, { iss: 'https://other.example' }, { scope: 'other' }, { exp: 1 },
    ]) {
      const forged = jwt.sign({ sub: config.userId, iss: config.origin, aud: config.resource, scope: 'scheduling', exp: Math.floor(Date.now() / 1000) + 60, ...claims }, config.secret);
      assert.throws(() => verifyMcpToken(forged, config));
    }
  } finally {
    findUser.mock.restore(); create.mock.restore(); consume.mock.restore();
    await new Promise<void>((resolve, reject) => http.close(error => error ? reject(error) : resolve()));
    for (const key of Object.keys(process.env)) if (!(key in previous)) delete process.env[key];
    Object.assign(process.env, previous);
  }
});
