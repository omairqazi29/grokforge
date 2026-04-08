'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlanViewer } from '@/components/plan-viewer';
import { DiffViewer } from '@/components/diff-viewer';
import { ValidationPanel } from '@/components/validation-panel';
import { ThinkingIndicator } from '@/components/thinking-indicator';
import {
  api,
  Session,
  Plan,
  PatchArtifact,
  ValidationRun,
  Repository,
  PRExportResult,
} from '@/lib/api-client';

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = Number(params.id);

  const [session, setSession] = useState<Session | null>(null);
  const [repo, setRepo] = useState<Repository | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [patch, setPatch] = useState<PatchArtifact | null>(null);
  const [validationRuns, setValidationRuns] = useState<ValidationRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [planLoading, setPlanLoading] = useState(false);
  const [patchLoading, setPatchLoading] = useState(false);
  const [validationLoading, setValidationLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('compose');
  const [autoFixing, setAutoFixing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [prResult, setPrResult] = useState<PRExportResult | null>(null);
  const [reviewComments, setReviewComments] = useState<
    { comment: string; filePath: string; line?: number }[]
  >([]);
  const thinkingStage = planLoading
    ? 'planning'
    : patchLoading
      ? 'patching'
      : validationLoading
        ? 'validating'
        : ('idle' as const);

  useEffect(() => {
    api.sessions
      .get(sessionId)
      .then(async (s) => {
        setSession(s);
        const r = await api.repos.get(s.repository_id);
        setRepo(r);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [sessionId]);

  const handleGeneratePlan = async (task: string, constraints: string[]) => {
    if (!session) return;
    await api.sessions.update(session.id, { title: task.slice(0, 60) });
    const updatedSession = await api.sessions.get(session.id);
    setSession(updatedSession);
    setPlanLoading(true);
    try {
      const generatedPlan = await api.plans.generate(session.id);
      setPlan(generatedPlan);
      setActiveTab('plan');
      setSession((prev) => (prev ? { ...prev, status: 'planned' } : null));
    } catch (err) {
      console.error(err);
    } finally {
      setPlanLoading(false);
    }
  };

  const handleGeneratePatch = async () => {
    if (!session) return;
    setPatchLoading(true);
    try {
      const generatedPatch = await api.patches.generate(session.id);
      setPatch(generatedPatch);
      setActiveTab('review');
      setSession((prev) => (prev ? { ...prev, status: 'reviewing' } : null));
    } catch (err) {
      console.error(err);
    } finally {
      setPatchLoading(false);
    }
  };

  const handleRunValidation = async (command: string) => {
    if (!session || !patch) return;
    setValidationLoading(true);
    try {
      const run = await api.validation.run(session.id, {
        command,
        patch_artifact_id: patch.id,
      });
      setValidationRuns((prev) => [run, ...prev]);
    } catch (err) {
      console.error(err);
    } finally {
      setValidationLoading(false);
    }
  };

  // P1: Auto-fix loop — regenerate patch after validation failure
  const handleAutoFix = async () => {
    if (!session || !patch) return;
    setAutoFixing(true);
    try {
      const newPatch = await api.patches.generate(session.id);
      setPatch(newPatch);
      setActiveTab('review');
    } catch (err) {
      console.error(err);
    } finally {
      setAutoFixing(false);
    }
  };

  const handlePatchAction = async (status: 'accepted' | 'rejected') => {
    if (!session || !patch) return;
    try {
      const updated = await api.patches.update(session.id, patch.id, status);
      setPatch(updated);
      if (status === 'accepted') {
        setSession((prev) => (prev ? { ...prev, status: 'completed' } : null));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // P2: GitHub PR export
  const handleExportPR = async () => {
    if (!session) return;
    setExporting(true);
    try {
      const result = await api.github.exportPR(session.id);
      setPrResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  const handleReviewComment = (comment: string, filePath: string, line?: number) => {
    setReviewComments((prev) => [...prev, { comment, filePath, line }]);
  };

  const hasFailedValidation = validationRuns.some((r) => r.exit_code !== 0);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-4 w-4 animate-spin border border-foreground border-t-transparent" />
      </div>
    );
  }

  if (!session || !repo) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Session not found
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/repos/${repo.id}`)}
              className="font-mono text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
            >
              &larr; {repo.name}
            </button>
            <span className="text-border">|</span>
            <span className="font-mono text-sm">{session.title}</span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {session.status}
            </span>
          </div>
          {/* P2: Token Dashboard indicator */}
          <div className="flex items-center gap-4">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Session #{session.id}
            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-6 pt-24 pb-16">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="compose">
              <span className="font-mono text-xs uppercase tracking-wider">Compose</span>
            </TabsTrigger>
            <TabsTrigger value="plan" disabled={!plan}>
              <span className="font-mono text-xs uppercase tracking-wider">Plan</span>
            </TabsTrigger>
            <TabsTrigger value="review" disabled={!patch}>
              <span className="font-mono text-xs uppercase tracking-wider">Review</span>
            </TabsTrigger>
            <TabsTrigger value="validate" disabled={!patch}>
              <span className="font-mono text-xs uppercase tracking-wider">Validate</span>
            </TabsTrigger>
          </TabsList>

          {/* Thinking animation */}
          {thinkingStage !== 'idle' && (
            <div className="mt-8">
              <ThinkingIndicator
                stage={thinkingStage}
                files={
                  repo?.file_tree.filter(
                    (f: string) => f.endsWith('.py') || f.endsWith('.ts') || f.endsWith('.tsx'),
                  ) || []
                }
              />
            </div>
          )}

          <div className="mt-8">
            {/* Compose — shows the task and a generate button */}
            <TabsContent value="compose">
              <div className="mx-auto max-w-3xl">
                <div className="border border-border">
                  <div className="border-b border-border px-8 py-5">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      Task
                    </p>
                  </div>
                  <div className="px-8 py-6">
                    <p className="text-sm leading-[1.8]">{session.task_description}</p>
                  </div>
                  {session.constraints && session.constraints.length > 0 && (
                    <div className="border-t border-border px-8 py-5">
                      <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        Constraints
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {session.constraints.map((c) => (
                          <span
                            key={c}
                            className="border border-border px-3 py-1 font-mono text-xs text-foreground/70"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="border-t border-border p-4">
                    <Button
                      onClick={() =>
                        handleGeneratePlan(session.task_description, session.constraints || [])
                      }
                      disabled={planLoading}
                      className="w-full py-3"
                    >
                      <span className="font-mono text-xs uppercase tracking-[0.15em]">
                        {planLoading ? 'Generating Plan...' : 'Generate Plan'}
                      </span>
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Plan */}
            <TabsContent value="plan">
              {plan && (
                <div className="space-y-6">
                  <PlanViewer plan={plan} />
                  <div className="flex justify-end gap-3 border-t border-border pt-6">
                    <Button variant="outline" onClick={() => setActiveTab('compose')}>
                      <span className="font-mono text-xs uppercase tracking-wider">
                        Revise Task
                      </span>
                    </Button>
                    <Button onClick={handleGeneratePatch} disabled={patchLoading}>
                      <span className="font-mono text-xs uppercase tracking-wider">
                        {patchLoading ? 'Generating...' : 'Generate Patch'}
                      </span>
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Review */}
            <TabsContent value="review">
              {patch && (
                <div className="space-y-6">
                  <DiffViewer
                    changes={patch.changes}
                    overallRationale={patch.overall_rationale}
                    onReviewComment={patch.status === 'pending' ? handleReviewComment : undefined}
                  />
                  {/* Review comments */}
                  {reviewComments.length > 0 && (
                    <div className="border border-border p-6">
                      <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        Review Comments ({reviewComments.length})
                      </p>
                      <div className="space-y-3">
                        {reviewComments.map((rc, i) => (
                          <div key={i} className="flex gap-3 text-xs">
                            <span className="shrink-0 font-mono text-muted-foreground">
                              {rc.filePath}
                              {rc.line ? `:${rc.line}` : ''}
                            </span>
                            <span className="text-foreground/70">{rc.comment}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-border pt-6">
                    <div>
                      {patch.status === 'accepted' && (
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                            Accepted
                          </span>
                          {!prResult && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleExportPR}
                              disabled={exporting}
                            >
                              <span className="font-mono text-xs uppercase tracking-wider">
                                {exporting ? 'Exporting...' : 'Export as PR'}
                              </span>
                            </Button>
                          )}
                          {prResult && (
                            <span className="font-mono text-xs text-muted-foreground">
                              Branch: {prResult.branch}
                              {prResult.pr_url && (
                                <>
                                  {' '}
                                  &middot;{' '}
                                  <a
                                    href={prResult.pr_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline hover:text-foreground"
                                  >
                                    View PR
                                  </a>
                                </>
                              )}
                            </span>
                          )}
                        </div>
                      )}
                      {patch.status === 'rejected' && (
                        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                          Rejected
                        </span>
                      )}
                    </div>
                    <div className="flex gap-3">
                      {patch.status === 'pending' && (
                        <>
                          <Button variant="outline" onClick={() => handlePatchAction('rejected')}>
                            <span className="font-mono text-xs uppercase tracking-wider">
                              Reject
                            </span>
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleGeneratePatch}
                            disabled={patchLoading}
                          >
                            <span className="font-mono text-xs uppercase tracking-wider">
                              Regenerate
                            </span>
                          </Button>
                          <Button onClick={() => handlePatchAction('accepted')}>
                            <span className="font-mono text-xs uppercase tracking-wider">
                              Accept
                            </span>
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Validate */}
            <TabsContent value="validate">
              <div className="space-y-6">
                <ValidationPanel
                  runs={validationRuns}
                  onRunValidation={handleRunValidation}
                  loading={validationLoading}
                  repoId={repo?.id}
                />
                {/* P1: Auto-fix loop */}
                {hasFailedValidation && patch?.status === 'pending' && (
                  <div className="border border-border p-6">
                    <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      Auto-Fix
                    </p>
                    <p className="mb-4 text-sm text-muted-foreground">
                      Validation failed. Regenerate the patch with failure context to attempt an
                      automatic fix.
                    </p>
                    <Button onClick={handleAutoFix} disabled={autoFixing}>
                      <span className="font-mono text-xs uppercase tracking-wider">
                        {autoFixing ? 'Fixing...' : 'Auto-Fix & Regenerate'}
                      </span>
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
