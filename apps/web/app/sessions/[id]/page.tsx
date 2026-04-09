'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlanViewer, PlanComment } from '@/components/plan-viewer';
import { DiffViewer } from '@/components/diff-viewer';
import { ValidationPanel } from '@/components/validation-panel';
import { ThinkingIndicator } from '@/components/thinking-indicator';
import { ErrorAlert } from '@/components/error-alert';
import { useSessionWorkflow } from '@/hooks/use-session-workflow';
import { STATUS_DISPLAY, PATCH_STATUS } from '@/lib/constants';
import type {
  Session,
  Plan,
  PatchArtifact,
  ValidationRun,
  Repository,
  PRExportResult,
} from '@/lib/api-client';

// ---------------------------------------------------------------------------
// ComposeTab
// ---------------------------------------------------------------------------

function ComposeTab({
  session,
  planLoading,
  onGeneratePlan,
}: {
  session: Session;
  planLoading: boolean;
  onGeneratePlan: (task: string, constraints: string[]) => void;
}) {
  return (
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
              onClick={() => onGeneratePlan(session.task_description, session.constraints || [])}
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
  );
}

// ---------------------------------------------------------------------------
// PlanTab
// ---------------------------------------------------------------------------

function PlanTab({
  plan,
  patch,
  session,
  planLoading,
  patchLoading,
  planComments,
  onSetPlanComments,
  onGeneratePlan,
  onGeneratePatch,
  onGoToCompose,
}: {
  plan: Plan;
  patch: PatchArtifact | null;
  session: Session;
  planLoading: boolean;
  patchLoading: boolean;
  planComments: PlanComment[];
  onSetPlanComments: (c: PlanComment[]) => void;
  onGeneratePlan: (task: string, constraints: string[]) => void;
  onGeneratePatch: () => void;
  onGoToCompose: () => void;
}) {
  return (
    <TabsContent value="plan">
      <div className="space-y-6">
        <PlanViewer
          plan={plan}
          onComment={onSetPlanComments}
          editable={!patch || patch.status === PATCH_STATUS.PENDING}
        />
        <div className="flex items-center justify-between border-t border-border pt-6">
          <div>
            {planComments.length > 0 && (
              <Button
                variant="outline"
                onClick={() => onGeneratePlan(session.task_description, session.constraints || [])}
                disabled={planLoading}
              >
                <span className="font-mono text-xs uppercase tracking-wider">
                  {planLoading ? 'Regenerating...' : 'Regenerate Plan'}
                </span>
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onGoToCompose}>
              <span className="font-mono text-xs uppercase tracking-wider">Revise Task</span>
            </Button>
            <Button onClick={onGeneratePatch} disabled={patchLoading}>
              <span className="font-mono text-xs uppercase tracking-wider">
                {patchLoading ? 'Generating...' : 'Generate Patch'}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </TabsContent>
  );
}

// ---------------------------------------------------------------------------
// ReviewTab
// ---------------------------------------------------------------------------

type ReviewComment = { comment: string; filePath: string; selectedCode?: string };

function ReviewTab({
  patch,
  prResult,
  exporting,
  exportError,
  patchLoading,
  reviewComments,
  confirmAccept,
  onAddComment,
  onAccept,
  onReject,
  onRegenerate,
  onExportPR,
  onSetConfirmAccept,
}: {
  patch: PatchArtifact;
  prResult: PRExportResult | null;
  exporting: boolean;
  exportError: string;
  patchLoading: boolean;
  reviewComments: ReviewComment[];
  confirmAccept: boolean;
  onAddComment: (comment: string, filePath: string, selectedCode?: string) => void;
  onAccept: () => void;
  onReject: () => void;
  onRegenerate: () => void;
  onExportPR: () => void;
  onSetConfirmAccept: (v: boolean) => void;
}) {
  const isPending = patch.status === PATCH_STATUS.PENDING;

  return (
    <TabsContent value="review">
      <div className="space-y-6">
        <DiffViewer
          changes={patch.changes}
          overallRationale={patch.overall_rationale}
          onReviewComment={isPending ? onAddComment : undefined}
        />

        {reviewComments.length > 0 && (
          <div className="border border-border p-6">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Review Comments ({reviewComments.length})
            </p>
            <div className="space-y-3">
              {reviewComments.map((rc, i) => (
                <div key={i} className="border-b border-border/50 pb-3 last:border-0 last:pb-0">
                  <p className="font-mono text-[10px] text-muted-foreground">{rc.filePath}</p>
                  {rc.selectedCode && (
                    <pre className="my-1 max-h-[60px] overflow-hidden border-l-2 border-foreground/10 pl-3 font-mono text-[10px] text-foreground/30">
                      {rc.selectedCode}
                    </pre>
                  )}
                  <p className="text-xs text-foreground/70">{rc.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border pt-6">
          <PatchStatusInfo
            patch={patch}
            prResult={prResult}
            exporting={exporting}
            exportError={exportError}
            onExportPR={onExportPR}
          />
          <div className="flex gap-3">
            {isPending && (
              <>
                <Button variant="outline" onClick={onReject}>
                  <span className="font-mono text-xs uppercase tracking-wider">Reject</span>
                </Button>
                <Button variant="outline" onClick={onRegenerate} disabled={patchLoading}>
                  <span className="font-mono text-xs uppercase tracking-wider">Regenerate</span>
                </Button>
                <Button onClick={onAccept}>
                  <span className="font-mono text-xs uppercase tracking-wider">Accept</span>
                </Button>
              </>
            )}
          </div>
        </div>

        {confirmAccept && (
          <div className="border border-yellow-500/30 bg-yellow-500/5 p-4">
            <p className="mb-1 font-mono text-xs uppercase tracking-wider text-yellow-400/80">
              Unreviewed Comments
            </p>
            <p className="mb-3 text-xs text-foreground/60">
              You have {reviewComments.length} review comment{reviewComments.length > 1 ? 's' : ''}{' '}
              that{reviewComments.length > 1 ? ' have' : ' has'} not been addressed. Accept anyway?
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  onSetConfirmAccept(false);
                  onAccept();
                }}
              >
                <span className="font-mono text-[10px] uppercase tracking-wider">
                  Accept Anyway
                </span>
              </Button>
              <Button size="sm" variant="outline" onClick={() => onSetConfirmAccept(false)}>
                <span className="font-mono text-[10px] uppercase tracking-wider">Go Back</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </TabsContent>
  );
}

/** Displays accepted/rejected status and PR export info. */
function PatchStatusInfo({
  patch,
  prResult,
  exporting,
  exportError,
  onExportPR,
}: {
  patch: PatchArtifact;
  prResult: PRExportResult | null;
  exporting: boolean;
  exportError: string;
  onExportPR: () => void;
}) {
  if (patch.status === PATCH_STATUS.ACCEPTED) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Changes Applied
          </span>
          {!prResult && (
            <Button variant="outline" size="sm" onClick={onExportPR} disabled={exporting}>
              <span className="font-mono text-xs uppercase tracking-wider">
                {exporting ? 'Creating PR...' : 'Push & Create PR'}
              </span>
            </Button>
          )}
        </div>
        {prResult && (
          <div className="border border-border p-4">
            <div className="flex items-center gap-6 font-mono text-xs">
              <div>
                <span className="text-muted-foreground">Branch </span>
                <span>{prResult.branch}</span>
              </div>
              {prResult.commit_sha && (
                <div>
                  <span className="text-muted-foreground">Commit </span>
                  <span>{prResult.commit_sha}</span>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Files </span>
                <span>{prResult.files_changed}</span>
              </div>
              {prResult.pr_url && (
                <a
                  href={prResult.pr_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground underline underline-offset-4 hover:text-foreground/70"
                >
                  View PR on GitHub
                </a>
              )}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{prResult.message}</p>
          </div>
        )}
        {exportError && <p className="mt-2 font-mono text-xs text-red-400">{exportError}</p>}
      </div>
    );
  }
  if (patch.status === PATCH_STATUS.REJECTED) {
    return (
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        Rejected
      </span>
    );
  }
  return <div />;
}

// ---------------------------------------------------------------------------
// ValidateTab
// ---------------------------------------------------------------------------

function ValidateTab({
  validationRuns,
  validationLoading,
  autoFixing,
  patch,
  repo,
  sessionId,
  onRunValidation,
  onAutoFix,
}: {
  validationRuns: ValidationRun[];
  validationLoading: boolean;
  autoFixing: boolean;
  patch: PatchArtifact | null;
  repo: Repository | null;
  sessionId: number;
  onRunValidation: (command: string) => Promise<void>;
  onAutoFix: () => void;
}) {
  const hasFailedValidation = validationRuns.some((r) => r.exit_code !== 0);
  return (
    <TabsContent value="validate">
      <div className="space-y-6">
        <ValidationPanel
          runs={validationRuns}
          onRunValidation={onRunValidation}
          loading={validationLoading}
          repoId={repo?.id}
          sessionId={sessionId}
          patchId={patch?.id}
        />
        {hasFailedValidation && patch?.status === PATCH_STATUS.PENDING && (
          <div className="border border-border p-6">
            <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Auto-Fix
            </p>
            <p className="mb-4 text-sm text-muted-foreground">
              Validation failed. Regenerate the patch with failure context to attempt an automatic
              fix.
            </p>
            <Button onClick={onAutoFix} disabled={autoFixing}>
              <span className="font-mono text-xs uppercase tracking-wider">
                {autoFixing ? 'Fixing...' : 'Auto-Fix & Regenerate'}
              </span>
            </Button>
          </div>
        )}
      </div>
    </TabsContent>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function SessionPage() {
  const params = useParams();
  const sessionId = Number(params.id);
  const wf = useSessionWorkflow(sessionId);

  const [activeTab, setActiveTab] = useState('compose');
  const [reviewComments, setReviewComments] = useState<ReviewComment[]>([]);
  const [planComments, setPlanComments] = useState<PlanComment[]>([]);
  const [confirmAccept, setConfirmAccept] = useState(false);

  // Set initial tab based on loaded session status (runs once after load)
  useEffect(() => {
    if (wf.loading || !wf.session) return;
    if (wf.session.status === 'completed' || wf.session.status === 'reviewing') {
      if (wf.patch?.changes?.length) {
        setActiveTab('review');
        return;
      }
    }
    if (wf.session.status === 'planned' && wf.plan) setActiveTab('plan');
  }, [wf.loading, wf.session, wf.patch, wf.plan]);

  const thinkingStage = wf.planLoading
    ? 'planning'
    : wf.patchLoading
      ? 'patching'
      : wf.validationLoading
        ? 'validating'
        : ('idle' as const);

  const handleGeneratePlan = async (task: string, constraints: string[]) => {
    await wf.generatePlan(task, constraints);
    setActiveTab('plan');
  };
  const handleGeneratePatch = async () => {
    const feedback =
      reviewComments.length > 0
        ? reviewComments.map((rc) => {
            const prefix = rc.filePath ? `[${rc.filePath}] ` : '';
            const code = rc.selectedCode ? ` (re: "${rc.selectedCode.slice(0, 100)}")` : '';
            return `${prefix}${rc.comment}${code}`;
          })
        : undefined;
    await wf.generatePatch(feedback);
    setActiveTab('review');
  };
  const handleAutoFix = async () => {
    await wf.autoFix();
    setActiveTab('review');
  };
  const handleAccept = () => {
    if (reviewComments.length > 0 && !confirmAccept) {
      setConfirmAccept(true);
      return;
    }
    setConfirmAccept(false);
    wf.acceptPatch();
  };

  if (wf.loading)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-4 w-4 animate-spin border border-foreground border-t-transparent" />
      </div>
    );
  if (!wf.session || !wf.repo)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Session not found
        </p>
      </div>
    );

  const statusColor = STATUS_DISPLAY[wf.session.status]?.color ?? 'text-muted-foreground';

  return (
    <div className="px-8 py-8">
      <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-4">
          <span className="font-mono text-sm">{wf.session.title}</span>
          <span className={`font-mono text-[10px] uppercase tracking-widest ${statusColor}`}>
            {wf.session.status}
          </span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          #{wf.session.id}
        </span>
      </div>

      {wf.error && (
        <div className="mb-6">
          <ErrorAlert message={wf.error} />
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="compose">
            <span className="font-mono text-xs uppercase tracking-wider">Compose</span>
          </TabsTrigger>
          <TabsTrigger value="plan" disabled={!wf.plan}>
            <span className="font-mono text-xs uppercase tracking-wider">Plan</span>
          </TabsTrigger>
          <TabsTrigger value="review" disabled={!wf.patch}>
            <span className="font-mono text-xs uppercase tracking-wider">Review</span>
          </TabsTrigger>
          <TabsTrigger value="validate" disabled={!wf.patch}>
            <span className="font-mono text-xs uppercase tracking-wider">Validate</span>
          </TabsTrigger>
        </TabsList>

        {thinkingStage !== 'idle' && (
          <div className="mt-8">
            <ThinkingIndicator
              stage={thinkingStage}
              files={wf.repo.file_tree.filter(
                (f: string) => f.endsWith('.py') || f.endsWith('.ts') || f.endsWith('.tsx'),
              )}
            />
          </div>
        )}

        <div className="mt-8">
          <ComposeTab
            session={wf.session}
            planLoading={wf.planLoading}
            onGeneratePlan={handleGeneratePlan}
          />
          {wf.plan && (
            <PlanTab
              plan={wf.plan}
              patch={wf.patch}
              session={wf.session}
              planLoading={wf.planLoading}
              patchLoading={wf.patchLoading}
              planComments={planComments}
              onSetPlanComments={setPlanComments}
              onGeneratePlan={handleGeneratePlan}
              onGeneratePatch={handleGeneratePatch}
              onGoToCompose={() => setActiveTab('compose')}
            />
          )}
          {wf.patch && (
            <ReviewTab
              patch={wf.patch}
              prResult={wf.prResult}
              exporting={wf.exporting}
              exportError={wf.exportError}
              patchLoading={wf.patchLoading}
              reviewComments={reviewComments}
              confirmAccept={confirmAccept}
              onAddComment={(comment, filePath, selectedCode) =>
                setReviewComments((prev) => [...prev, { comment, filePath, selectedCode }])
              }
              onAccept={handleAccept}
              onReject={wf.rejectPatch}
              onRegenerate={handleGeneratePatch}
              onExportPR={wf.exportPR}
              onSetConfirmAccept={setConfirmAccept}
            />
          )}
          <ValidateTab
            validationRuns={wf.validationRuns}
            validationLoading={wf.validationLoading}
            autoFixing={wf.autoFixing}
            patch={wf.patch}
            repo={wf.repo}
            sessionId={wf.session.id}
            onRunValidation={wf.runValidation}
            onAutoFix={handleAutoFix}
          />
        </div>
      </Tabs>
    </div>
  );
}
