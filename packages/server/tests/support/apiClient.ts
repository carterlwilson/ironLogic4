import { BASE_URL } from './constants';

export interface Fixture {
  userId: string;
  gymId: string;
  accessToken: string;
  templates: {
    weight: { templateId: string; oneRM: string; threeRM: string; fiveRM: string; tenRM: string };
    distance: { templateId: string; min1: string; min3: string; min5: string };
    time: { templateId: string; m100: string; m500: string; mile1: string };
    reps: { templateId: string };
    other: { templateId: string };
  };
}

export function getFixture(): Fixture {
  return JSON.parse(process.env.__TEST_FIXTURE__!);
}

export interface ApiResponse {
  status: number;
  json: any;
}

export async function apiFetch(
  method: string,
  path: string,
  body?: unknown,
  token?: string
): Promise<ApiResponse> {
  const authToken = token ?? getFixture().accessToken;
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => undefined);
  return { status: res.status, json };
}

export async function apiFetchNoAuth(method: string, path: string, body?: unknown): Promise<ApiResponse> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => undefined);
  return { status: res.status, json };
}
