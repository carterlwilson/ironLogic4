import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createSchedulingServer, schedulingOperations } from '../../src/mcp/scheduling.js';

const activeId = 'active-id';
const slotId = 'slot-id';
const clientId = 'client-id';
const available = {
  success: true,
  data: [{
    id: activeId, gymId: { id: 'gym-id', name: 'Gym' }, templateId: { id: 'template-id', name: 'Recurring' },
    days: [{ dayOfWeek: 1, timeSlots: [
      { id: slotId, startTime: '09:00', location: 'Room A', availableSpots: 2, assignedClients: [clientId], coaches: [{ id: 'coach-a', firstName: 'A' }] },
      { id: 'other-slot', startTime: '09:00', location: 'Room B', availableSpots: 1, assignedClients: [], coaches: [{ id: 'coach-b', firstName: 'B' }] },
    ] }],
  }],
};

async function connect(request: typeof fetch) {
  const server = createSchedulingServer('https://backend.example', 'test-token', request);
  const client = new Client({ name: 'test', version: '1' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  return { client, close: async () => { await client.close(); await server.close(); } };
}

test('exposes precisely the YAML operations and no other MCP capabilities', async () => {
  const connection = await connect(async () => Response.json({ success: true }));
  try {
    const { tools } = await connection.client.listTools();
    const yaml = readFileSync(new URL('../../ironlogic4-chatgpt-scheduling-openapi-v2.yaml', import.meta.url), 'utf8');
    const names = [...yaml.matchAll(/operationId: (\w+)/g)].map(match => match[1]);
    assert.equal(tools.length, 7);
    assert.deepEqual(tools.map(tool => tool.name).sort(), names.sort());
    assert.deepEqual(connection.client.getServerCapabilities(), { tools: { listChanged: true } });
    for (const tool of tools) {
      assert.equal(tool.annotations?.readOnlyHint, tool.name.startsWith('list') || tool.name === 'searchClients');
      assert.equal(tool.inputSchema.additionalProperties, false);
    }
    assert.match(tools.find(tool => tool.name === 'listAvailableSchedules')!.description!, /clarify location or coach/);
  } finally { await connection.close(); }
});

test('all seven calls preserve method, route, query, body and authentication', async () => {
  const calls: { url: URL; init: RequestInit }[] = [];
  const connection = await connect(async (url, init) => {
    calls.push({ url: new URL(String(url)), init: init! });
    return Response.json(available);
  });
  try {
    for (const operation of schedulingOperations) {
      const args = operation.name === 'searchClients' ? { search: 'Ann & Bob', page: 2, limit: 20 }
        : operation.name === 'listScheduleTemplates' ? { gymId: 'gym-id', coachId: 'coach-id' }
        : operation.name === 'listAvailableSchedules' ? {}
        : { id: operation.name.includes('Template') ? 'template-id' : activeId, timeslotId: slotId, clientId };
      const result = await connection.client.callTool({ name: operation.name, arguments: args });
      assert.equal(result.isError, false);
      assert.deepEqual(result.structuredContent, available);
      const call = calls.at(-1)!;
      assert.equal(call.init.method, operation.method);
      assert.equal((call.init.headers as Record<string, string>).Authorization, 'Bearer test-token');
      assert.equal(call.init.redirect, 'error');
      assert.equal(call.url.pathname, operation.path.replace('{id}', String(args.id)).replace('{timeslotId}', slotId).replace('{clientId}', clientId));
      if (operation.method === 'POST') assert.deepEqual(JSON.parse(String(call.init.body)), { clientId });
      else assert.equal(call.init.body, undefined);
    }
    assert.equal(calls[0].url.searchParams.get('search'), 'Ann & Bob');
    assert.equal(calls[0].url.searchParams.get('page'), '2');
    assert.equal(calls[1].url.searchParams.get('coachId'), 'coach-id');
    assert.equal(calls[2].url.search, '');
  } finally { await connection.close(); }
});

test('rejects unknown tools and invalid arguments without a backend request', async () => {
  let calls = 0;
  const connection = await connect(async () => { calls++; return Response.json({ success: true }); });
  try {
    for (const [name, args] of [
      ['deleteSchedule', {}], ['searchClients', { limit: 101 }], ['searchClients', { page: 0 }],
      ['listAvailableSchedules', { gymId: 'unexpected' }], ['addClientToActiveTimeslot', { id: activeId }],
      ['removeClientFromTemplateTimeslot', { id: '', timeslotId: slotId, clientId }],
      ['addClientToActiveTimeslot', { id: '..', timeslotId: slotId, clientId }],
    ] as const) {
      const result = await connection.client.callTool({ name, arguments: args });
      assert.equal(result.isError, true);
    }
    assert.equal(calls, 0);
  } finally { await connection.close(); }
});

test('does not report HTTP or backend failures as success, or leak transport secrets', async () => {
  for (const response of [
    Response.json({ success: false, error: 'Timeslot full' }, { status: 400 }),
    Response.json({ success: false, error: 'Insufficient permissions' }, { status: 403 }),
    Response.json({ success: false, error: 'Invalid or expired token' }, { status: 401 }),
    Response.json({ success: false, error: 'Already assigned' }),
    Response.json({ success: true }, { status: 500 }),
    Response.json({ data: [] }), new Response('not JSON'),
  ]) {
    const connection = await connect(async () => response);
    try {
      const result = await connection.client.callTool({ name: 'addClientToActiveTimeslot', arguments: { id: activeId, timeslotId: slotId, clientId } });
      assert.equal(result.isError, true);
    } finally { await connection.close(); }
  }
  const connection = await connect(async () => { throw new Error('test-token'); });
  try {
    const result = await connection.client.callTool({ name: 'listAvailableSchedules', arguments: {} });
    assert.equal(result.isError, true);
    assert.doesNotMatch(JSON.stringify(result), /test-token/);
  } finally { await connection.close(); }
});

test('rejects nonlocal plaintext or credential-bearing API origins', () => {
  for (const url of ['http://backend.example', 'https://user:secret@backend.example', 'https://backend.example/other', 'https://backend.example?token=secret']) {
    assert.throws(() => createSchedulingServer(url, 'test-token'));
  }
});

test('authentication fields never reach MCP text or structured responses', async () => {
  const connection = await connect(async () => Response.json({
    success: true, data: [{ id: clientId, firstName: 'Ann', password: 'secret-password',
      refreshTokens: [{ token: 'secret-refresh-token' }], resetToken: 'secret-reset-token',
      nested: { accessToken: 'secret-access-token', inviteToken: 'secret-invite-token', id: 'public-id' },
    }], pagination: { total: 1 },
  }));
  try {
    const result = await connection.client.callTool({ name: 'searchClients', arguments: {} });
    assert.doesNotMatch(JSON.stringify(result), /secret-/);
    assert.deepEqual(result.structuredContent, {
      success: true, data: [{ id: clientId, firstName: 'Ann', nested: { id: 'public-id' } }], pagination: { total: 1 },
    });
  } finally { await connection.close(); }
});
