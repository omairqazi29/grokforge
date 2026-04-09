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

// Repository types
export interface Repository {
  id: number;
  name: string;
  path: string;
  file_tree: string[];
  symbol_index: Record<string, string[]>;
  summary: string;
  created_at: string;
  updated_at: string;
}

// Session types
export interface Session {
  id: number;
  repository_id: number;
  title: string;
  task_description: string;
  constraints: string[];
  status: string;
  created_at: string;
  updated_at: string;
}

// Plan types
export interface PlanStep {
  order: number;
  description: string;
  affected_files: string[];
}

export interface Plan {
  id: number;
  session_id: number;
  goal: string;
  steps: PlanStep[];
  affected_files: string[];
  risks: string[];
  validation_checklist: string[];
  created_at: string;
}

// Patch types
export interface PatchFileChange {
  file_path: string;
  original_content: string;
  patched_content: string;
  diff: string;
  rationale: string;
}

export interface PatchArtifact {
  id: number;
  session_id: number;
  plan: Record<string, unknown> | null;
  changes: PatchFileChange[];
  overall_rationale: string;
  status: string;
  created_at: string;
}

// Validation types
export interface ValidationRun {
  id: number;
  session_id: number;
  patch_artifact_id: number;
  command: string;
  exit_code: number;
  stdout: string;
  stderr: string;
  analysis: string;
  duration_ms: number;
  created_at: string;
}

// Token usage types
export interface TokenUsage {
  id: number;
  session_id: number | null;
  operation: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost_usd: number;
  created_at: string;
}

export interface TokenSummary {
  total_prompt_tokens: number;
  total_completion_tokens: number;
  total_tokens: number;
  total_cost_usd: number;
  request_count: number;
}

// PR export types
export interface PRExportResult {
  branch: string;
  files_changed: number;
  message: string;
  pr_url: string | null;
  commit_sha: string | null;
}

// GitHub types
export interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string | null;
}

export interface GitHubRepo {
  full_name: string;
  clone_url: string;
  default_branch: string;
  private: boolean;
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
  },
};
