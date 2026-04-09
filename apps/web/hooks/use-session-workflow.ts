/**
 * Manages the full session workflow: plan → patch → validate → accept.
 * Extracts the 19-useState mess from SessionPage into a clean hook.
 *
 * Design decision: This hook owns the entire workflow state machine.
 * The page component only handles rendering and user events.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  api,
  Session,
  Plan,
  PatchArtifact,
  ValidationRun,
  Repository,
  PRExportResult,
} from '@/lib/api-client';

interface PlanData {
  goal: string;
  steps: { order: number; description: string; affected_files: string[] }[];
  affected_files: string[];
  risks: string[];
  validation_checklist: string[];
}

interface WorkflowState {
  session: Session | null;
  repo: Repository | null;
  plan: Plan | null;
  patch: PatchArtifact | null;
  validationRuns: ValidationRun[];
  prResult: PRExportResult | null;
  loading: boolean;
  planLoading: boolean;
  patchLoading: boolean;
  validationLoading: boolean;
  autoFixing: boolean;
  exporting: boolean;
  exportError: string;
  error: string | null;
}

interface WorkflowActions {
  generatePlan: (task: string, constraints: string[]) => Promise<void>;
  generatePatch: (feedback?: string[]) => Promise<void>;
  runValidation: (command: string) => Promise<void>;
  acceptPatch: () => Promise<void>;
  rejectPatch: () => Promise<void>;
  autoFix: () => Promise<void>;
  exportPR: () => Promise<void>;
}

export function useSessionWorkflow(sessionId: number): WorkflowState & WorkflowActions {
  const [session, setSession] = useState<Session | null>(null);
  const [repo, setRepo] = useState<Repository | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [patch, setPatch] = useState<PatchArtifact | null>(null);
  const [validationRuns, setValidationRuns] = useState<ValidationRun[]>([]);
  const [prResult, setPrResult] = useState<PRExportResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [planLoading, setPlanLoading] = useState(false);
  const [patchLoading, setPatchLoading] = useState(false);
  const [validationLoading, setValidationLoading] = useState(false);
  const [autoFixing, setAutoFixing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Load session + all related data on mount
  useEffect(() => {
    async function load() {
      try {
        const s = await api.sessions.get(sessionId);
        setSession(s);
        const r = await api.repos.get(s.repository_id);
        setRepo(r);

        // Load existing patches
        const patches = await api.patches.list(sessionId);
        if (patches.length > 0) {
          const latest = patches[0];
          setPatch(latest);
          if (latest.pr_branch) {
            setPrResult({
              branch: latest.pr_branch,
              pr_url: latest.pr_url || null,
              commit_sha: latest.pr_commit_sha || null,
              files_changed: latest.changes?.length || 0,
              message: latest.pr_url
                ? `PR created on ${latest.pr_branch}`
                : `Branch ${latest.pr_branch} created`,
            });
          }
        }

        // Load existing validations
        const runs = await api.validation.list(sessionId);
        if (runs.length > 0) setValidationRuns(runs);

        // Reconstruct plan from patch
        if (patches.length > 0 && patches[0].plan) {
          const p = patches[0].plan as unknown as PlanData;
          setPlan({
            id: patches[0].id,
            session_id: sessionId,
            goal: p.goal || s.task_description,
            steps: p.steps || [],
            affected_files: p.affected_files || [],
            risks: p.risks || [],
            validation_checklist: p.validation_checklist || [],
            created_at: patches[0].created_at,
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load session');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sessionId]);

  const generatePlan = useCallback(
    async (task: string, constraints: string[]) => {
      if (!session) return;
      await api.sessions.update(session.id, { title: task.slice(0, 60) });
      setSession(await api.sessions.get(session.id));
      setPlanLoading(true);
      try {
        const generated = await api.plans.generate(session.id);
        setPlan(generated);
        setSession((prev) => (prev ? { ...prev, status: 'planned' } : null));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Plan generation failed');
      } finally {
        setPlanLoading(false);
      }
    },
    [session],
  );

  const generatePatch = useCallback(
    async (feedback?: string[]) => {
      if (!session) return;
      setPatchLoading(true);
      try {
        const generated = await api.patches.generate(session.id, feedback);
        setPatch(generated);
        setSession((prev) => (prev ? { ...prev, status: 'reviewing' } : null));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Patch generation failed');
      } finally {
        setPatchLoading(false);
      }
    },
    [session],
  );

  const runValidation = useCallback(
    async (command: string) => {
      if (!session || !patch) return;
      setValidationLoading(true);
      try {
        const run = await api.validation.run(session.id, {
          command,
          patch_artifact_id: patch.id,
        });
        setValidationRuns((prev) => [run, ...prev]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Validation failed');
      } finally {
        setValidationLoading(false);
      }
    },
    [session, patch],
  );

  const acceptPatch = useCallback(async () => {
    if (!session || !patch) return;
    try {
      const updated = await api.patches.update(session.id, patch.id, 'accepted');
      setPatch(updated);
      setSession((prev) => (prev ? { ...prev, status: 'completed' } : null));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Accept failed');
    }
  }, [session, patch]);

  const rejectPatch = useCallback(async () => {
    if (!session || !patch) return;
    try {
      const updated = await api.patches.update(session.id, patch.id, 'rejected');
      setPatch(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reject failed');
    }
  }, [session, patch]);

  const autoFix = useCallback(async () => {
    if (!session) return;
    setAutoFixing(true);
    try {
      const newPatch = await api.patches.generate(session.id);
      setPatch(newPatch);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Auto-fix failed');
    } finally {
      setAutoFixing(false);
    }
  }, [session]);

  const exportPR = useCallback(async () => {
    if (!session) return;
    setExporting(true);
    setExportError('');
    try {
      const result = await api.github.exportPR(session.id);
      setPrResult(result);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  }, [session]);

  return {
    session,
    repo,
    plan,
    patch,
    validationRuns,
    prResult,
    loading,
    planLoading,
    patchLoading,
    validationLoading,
    autoFixing,
    exporting,
    exportError,
    error,
    generatePlan,
    generatePatch,
    runValidation,
    acceptPatch,
    rejectPatch,
    autoFix,
    exportPR,
  };
}
