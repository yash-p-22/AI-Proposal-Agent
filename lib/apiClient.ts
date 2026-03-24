import type {
  AgentRunResult,
  RunAgentRequest,
  Proposal,
  AuditLog,
  JobPost,
  RegenerateSectionRequest,
} from '@/types';

const base = '/api';

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
  return data as T;
}

async function get<T>(url: string): Promise<T> {
  const res  = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
  return data as T;
}

// ─── Agent ────────────────────────────────────────────────────────────────────
export const agentApi = {
  run: (body: RunAgentRequest) =>
    post<AgentRunResult>(`${base}/agent/run`, body),
};

// ─── Proposals ────────────────────────────────────────────────────────────────
export const proposalsApi = {
  list: () =>
    get<{ proposals: Proposal[] }>(`${base}/proposals`).then(r => r.proposals),

  get: (id: string) =>
    get<Proposal>(`${base}/proposals/${id}`),

  approve: (id: string, approved_by = 'user') =>
    post<Proposal>(`${base}/proposals/${id}?action=approve`, { approved_by }),

  reject: (id: string, reason?: string) =>
    post<Proposal>(`${base}/proposals/${id}?action=reject`, { reason }),

  regenerateSection: (id: string, body: RegenerateSectionRequest) =>
    post<{ content: string }>(
      `${base}/proposals/${id}?action=regenerate`,
      body,
    ).then(r => r.content),
};

// ─── Audit ────────────────────────────────────────────────────────────────────
export const auditApi = {
  list: (limit = 100) =>
    get<{ logs: AuditLog[] }>(`${base}/audit?limit=${limit}`).then(r => r.logs),
};

// ─── Jobs ─────────────────────────────────────────────────────────────────────
export const jobsApi = {
  list: () =>
    get<{ jobs: JobPost[] }>(`${base}/jobs`).then(r => r.jobs),
};
