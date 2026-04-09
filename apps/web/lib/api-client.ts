import type {
  Repository,
  Session,
  Plan,
  PatchArtifact,
  ValidationRun,
  TokenUsage,
  TokenSummary,
  PRExportResult,
  BranchInfo,
  CommitInfo,
  GitHubIssue,
  GitHubUser,
  GitHubRepo,
} from './api-types';

// Re-export all types so existing imports continue to work
export type {
  Repository,
  Session,
  PlanStep,
  Plan,
  PatchFileChange,
  PatchArtifact,
  ValidationRun,
  TokenUsage,
  TokenSummary,
  PRExportResult,
  BranchInfo,
  CommitInfo,
  GitHubIssue,
  GitHubUser,
  GitHubRepo,
} from './api-types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

// API methods
export const api = {
  repos: {
    list: () => request<Repository[]>('/api/repos'),
    get: (id: number) => request<Repository>(`/api/repos/${id}`),
    create: (path: string) =>
      request<Repository>('/api/repos', {
        method: 'POST',
        body: JSON.stringify({ path }),
      }),
    delete: (id: number) => fetch(`${BASE_URL}/api/repos/${id}`, { method: 'DELETE' }),
  },
  branches: {
    list: (repoId: number) => request<BranchInfo[]>(`/api/repos/${repoId}/branches`),
    current: (repoId: number) =>
      request<{ branch: string | null }>(`/api/repos/${repoId}/branch/current`),
    create: (repoId: number, name: string, fromBranch?: string) =>
      request<BranchInfo>(`/api/repos/${repoId}/branches`, {
        method: 'POST',
        body: JSON.stringify({ name, from_branch: fromBranch }),
      }),
    checkout: (repoId: number, branch: string) =>
      request<{ branch: string; message: string }>(`/api/repos/${repoId}/branch/checkout`, {
        method: 'POST',
        body: JSON.stringify({ branch }),
      }),
    commits: (repoId: number, limit?: number, branch?: string) => {
      const params = new URLSearchParams();
      if (limit) params.set('limit', String(limit));
      if (branch) params.set('branch', branch);
      const qs = params.toString();
      return request<CommitInfo[]>(`/api/repos/${repoId}/commits${qs ? `?${qs}` : ''}`);
    },
  },
  sessions: {
    list: (repoId?: number) => {
      const params = repoId ? `?repository_id=${repoId}` : '';
      return request<Session[]>(`/api/sessions${params}`);
    },
    get: (id: number) => request<Session>(`/api/sessions/${id}`),
    create: (data: {
      repository_id: number;
      title: string;
      task_description: string;
      constraints?: string[];
    }) => request<Session>('/api/sessions', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: { status?: string; title?: string }) =>
      request<Session>(`/api/sessions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },
  plans: {
    generate: (sessionId: number) =>
      request<Plan>(`/api/sessions/${sessionId}/plan`, { method: 'POST' }),
  },
  patches: {
    list: (sessionId: number) => request<PatchArtifact[]>(`/api/sessions/${sessionId}/patches`),
    generate: (sessionId: number) =>
      request<PatchArtifact>(`/api/sessions/${sessionId}/patch`, { method: 'POST' }),
    update: (sessionId: number, patchId: number, status: string) =>
      request<PatchArtifact>(`/api/sessions/${sessionId}/patches/${patchId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
  },
  validation: {
    list: (sessionId: number) => request<ValidationRun[]>(`/api/sessions/${sessionId}/validations`),
    run: (sessionId: number, data: { command: string; patch_artifact_id: number }) =>
      request<ValidationRun>(`/api/sessions/${sessionId}/validate`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
  tokens: {
    list: (sessionId?: number) => {
      const params = sessionId ? `?session_id=${sessionId}` : '';
      return request<TokenUsage[]>(`/api/tokens${params}`);
    },
    summary: (sessionId?: number) => {
      const params = sessionId ? `?session_id=${sessionId}` : '';
      return request<TokenSummary>(`/api/tokens/summary${params}`);
    },
  },
  github: {
    exportPR: (sessionId: number, branchName?: string) =>
      request<PRExportResult>(`/api/sessions/${sessionId}/export-pr`, {
        method: 'POST',
        body: JSON.stringify({ branch_name: branchName }),
      }),
    user: () => request<GitHubUser>('/api/github/user'),
    repos: (limit?: number) =>
      request<GitHubRepo[]>(`/api/github/repos${limit ? `?limit=${limit}` : ''}`),
    clone: (repoUrl: string, targetDir?: string) =>
      request<{ path: string; message: string }>('/api/github/clone', {
        method: 'POST',
        body: JSON.stringify({ repo_url: repoUrl, target_dir: targetDir }),
      }),
    issues: (repo: string, state?: string) =>
      request<GitHubIssue[]>(
        `/api/github/issues?repo=${encodeURIComponent(repo)}${state ? `&state=${state}` : ''}`,
      ),
  },
  chat: {
    send: (messages: { role: string; content: string }[], repoId?: number, sessionId?: number) =>
      request<{ reply: string }>('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ messages, repo_id: repoId, session_id: sessionId }),
      }),
  },
};
