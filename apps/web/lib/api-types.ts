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
  pr_branch: string;
  pr_url: string;
  pr_commit_sha: string;
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

// Branch types
export interface BranchInfo {
  name: string;
  is_current: boolean;
}

export interface CommitInfo {
  sha: string;
  message: string;
  author: string;
  date: string;
}

// GitHub issue types
export interface GitHubIssue {
  number: number;
  title: string;
  body: string | null;
  state: string;
  labels: string[];
  url: string;
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
