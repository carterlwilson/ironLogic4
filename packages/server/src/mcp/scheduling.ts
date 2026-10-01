import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

const id = z.string().min(1).refine(value => value !== '.' && value !== '..', 'Invalid ID');
const enrollment = { id, timeslotId: id, clientId: id };
const resolve = 'Resolve IDs from lookup results or explicit user input; never invent IDs. Clarify ambiguous clients and timeslots by location or coach before writing. Clarify recurring versus current-week enrollment. Report success only when the API returns success: true.';
const privateFields = new Set(['password', 'refreshTokens', 'refreshToken', 'accessToken', 'resetToken', 'resetTokenExpiry', 'resetTokenUsed', 'inviteToken', 'inviteTokenExpiry', 'inviteTokenUsed']);

function publicResponse(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(publicResponse);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).filter(([key]) => !privateFields.has(key)).map(([key, entry]) => [key, publicResponse(entry)]));
  }
  return value;
}

export const schedulingOperations = [
  {
    name: 'searchClients', method: 'GET', path: '/api/gym/clients',
    schema: z.object({ search: z.string().optional(), page: z.number().int().min(1).optional(), limit: z.number().int().min(1).max(100).optional() }).strict(),
    description: 'Search clients by first name, last name, or email. Paginate when necessary. Clarify multiple matches. This does not identify the authenticated caller.',
  },
  {
    name: 'listScheduleTemplates', method: 'GET', path: '/api/gym/schedules/templates',
    schema: z.object({ gymId: id.optional(), coachId: id.optional() }).strict(),
    description: 'List recurring schedule templates with days and timeslot IDs. These schedule IDs are only for template enrollment. Coaches see their assigned schedules.',
  },
  {
    name: 'listAvailableSchedules', method: 'GET', path: '/api/gym/schedules/available',
    schema: z.object({}).strict(),
    description: 'Returns {success, data: [...]} with active schedules. data[].id is the active schedule ID; gymId and templateId are populated objects, not active IDs. Use days[].timeSlots[].id for timeslotId. Match dayOfWeek and startTime; clarify location or coach when simultaneous slots match. assignedClients contains client IDs; isUserAssigned describes the authenticated caller. Availability is a snapshot. No timezone or class date is supplied; do not infer future-week support.',
  },
  ...(['Template', 'Active'] as const).flatMap(kind => {
    const path = `/api/gym/schedules/${kind === 'Template' ? 'templates' : 'active'}/{id}/timeslots/{timeslotId}/clients`;
    const description = `Use a ${kind === 'Template' ? 'template schedule ID for recurring' : 'data[].id active schedule ID for current-week'} enrollment. ${resolve}`;
    return [
      { name: `addClientTo${kind}Timeslot`, method: 'POST', path, schema: z.object(enrollment).strict(), description: `Add a client. ${description}` },
      { name: `removeClientFrom${kind}Timeslot`, method: 'DELETE', path: `${path}/{clientId}`, schema: z.object(enrollment).strict(), description: `Remove a client. ${description}` },
    ];
  }),
];

export function createSchedulingServer(baseUrl: string, token: string, request: typeof fetch = fetch) {
  const origin = new URL(baseUrl);
  if (origin.protocol !== 'https:' && !(origin.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname))) {
    throw new Error('MCP API URL must use HTTPS or local HTTP');
  }
  if (origin.username || origin.password || origin.search || origin.hash || origin.pathname !== '/') {
    throw new Error('MCP API URL must be an origin without credentials');
  }
  const server = new McpServer({ name: 'ironlogic4-scheduling', version: '1.0.0' }, { instructions: resolve });
  for (const operation of schedulingOperations) {
    server.registerTool(operation.name, {
      description: operation.description,
      inputSchema: operation.schema,
      annotations: {
        readOnlyHint: operation.method === 'GET',
        destructiveHint: operation.method !== 'GET',
        idempotentHint: false,
        openWorldHint: false,
      },
    }, async raw => {
      const validation = operation.schema.safeParse(raw);
      if (!validation.success) {
        return { isError: true, content: [{ type: 'text', text: 'Invalid tool arguments' }] };
      }
      const args = validation.data as Record<string, string | number>;
      const path = operation.path.replace(/\{(\w+)\}/g, (_, key: string) => encodeURIComponent(String(args[key])));
      const url = new URL(path, origin);
      if (operation.method === 'GET') {
        for (const [key, value] of Object.entries(args)) url.searchParams.set(key, String(value));
      }
      try {
        const response = await request(url, {
          method: operation.method,
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          ...(operation.method === 'POST' ? { body: JSON.stringify({ clientId: args.clientId }) } : {}),
          redirect: 'error',
          signal: AbortSignal.timeout(15000),
        });
        const body = await response.json();
        if (!body || typeof body !== 'object' || typeof body.success !== 'boolean') {
          return { isError: true, content: [{ type: 'text', text: 'Backend returned an invalid API response' }] };
        }
        const safeBody = publicResponse(body) as Record<string, unknown>;
        return {
          isError: !response.ok || body.success !== true,
          content: [{ type: 'text', text: JSON.stringify(safeBody) }],
          structuredContent: safeBody,
        };
      } catch {
        return { isError: true, content: [{ type: 'text', text: 'Backend request failed. For enrollment, the outcome may be unknown; check assignments before retrying.' }] };
      }
    });
  }
  return server;
}
