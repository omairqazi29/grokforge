'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskComposer } from '@/components/task-composer';
import { PlanViewer } from '@/components/plan-viewer';
import { DiffViewer } from '@/components/diff-viewer';
import { ValidationPanel } from '@/components/validation-panel';
import { api, Session, Plan, PatchArtifact, ValidationRun, Repository } from '@/lib/api-client';

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

    // Update session with task if needed
    await api.sessions.update(session.id, { title: task.slice(0, 60) });

    // Create a new session with the task if current one doesn't have it
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading session...</p>
      </div>
    );
  }

  if (!session || !repo) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Session not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/repos/${repo.id}`)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              &larr; {repo.name}
            </button>
            <Separator orientation="vertical" className="h-6" />
            <h1 className="text-lg font-semibold">{session.title}</h1>
            <Badge variant="outline">{session.status}</Badge>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="compose">Compose</TabsTrigger>
            <TabsTrigger value="plan" disabled={!plan}>
              Plan
            </TabsTrigger>
            <TabsTrigger value="review" disabled={!patch}>
              Review
            </TabsTrigger>
            <TabsTrigger value="validate" disabled={!patch}>
              Validate
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="compose">
              <div className="mx-auto max-w-2xl">
                <Card>
                  <CardHeader>
                    <CardTitle>Describe Your Task</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TaskComposer onSubmit={handleGeneratePlan} loading={planLoading} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="plan">
              {plan && (
                <div className="space-y-4">
                  <PlanViewer plan={plan} />
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setActiveTab('compose')}>
                      Revise Task
                    </Button>
                    <Button onClick={handleGeneratePatch} disabled={patchLoading}>
                      {patchLoading ? 'Generating Patch...' : 'Generate Patch'}
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="review">
              {patch && (
                <div className="space-y-4">
                  <DiffViewer changes={patch.changes} overallRationale={patch.overall_rationale} />
                  <div className="flex justify-end gap-3">
                    {patch.status === 'pending' && (
                      <>
                        <Button variant="outline" onClick={() => handlePatchAction('rejected')}>
                          Reject
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleGeneratePatch}
                          disabled={patchLoading}
                        >
                          Regenerate
                        </Button>
                        <Button onClick={() => handlePatchAction('accepted')}>
                          Accept Changes
                        </Button>
                      </>
                    )}
                    {patch.status === 'accepted' && (
                      <Badge variant="default" className="text-sm">
                        Changes Accepted
                      </Badge>
                    )}
                    {patch.status === 'rejected' && (
                      <Badge variant="destructive" className="text-sm">
                        Changes Rejected
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="validate">
              <ValidationPanel
                runs={validationRuns}
                onRunValidation={handleRunValidation}
                loading={validationLoading}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
