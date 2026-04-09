'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { api, Repository, GitHubIssue } from '@/lib/api-client';

interface NewSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repo: Repository;
  initialTask?: string;
  onCreated: (sessionId: number) => void;
}

export function NewSessionDialog({
  open,
  onOpenChange,
  repo,
  initialTask = '',
  onCreated,
}: NewSessionDialogProps) {
  const [dialogTab, setDialogTab] = useState<'task' | 'issue'>('task');
  const [taskDesc, setTaskDesc] = useState(initialTask);
  const [constraintInput, setConstraintInput] = useState('');
  const [constraints, setConstraints] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [issuesLoading, setIssuesLoading] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<GitHubIssue | null>(null);

  // Sync initialTask when it changes externally
  const [prevInitialTask, setPrevInitialTask] = useState(initialTask);
  if (initialTask !== prevInitialTask) {
    setPrevInitialTask(initialTask);
    setTaskDesc(initialTask);
  }

  const handleCreateSession = async () => {
    if (!taskDesc.trim()) return;
    setCreating(true);
    const task = taskDesc.trim();
    const autoTitle = task.length > 60 ? task.slice(0, 57) + '...' : task;
    try {
      const session = await api.sessions.create({
        repository_id: repo.id,
        title: autoTitle,
        task_description: task,
        constraints: constraints.length > 0 ? constraints : undefined,
      });
      onOpenChange(false);
      setTaskDesc('');
      setConstraints([]);
      setConstraintInput('');
      setSelectedIssue(null);
      onCreated(session.id);
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleLoadIssues = async () => {
    setIssuesLoading(true);
    try {
      const ghRepos = await api.github.repos(100);
      const match = ghRepos.find(
        (r) => r.full_name.endsWith('/' + repo.name) || r.full_name.includes(repo.name),
      );
      if (match) {
        const issueList = await api.github.issues(match.full_name);
        setIssues(issueList);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIssuesLoading(false);
    }
  };

  const handleSelectIssue = (issue: GitHubIssue) => {
    setSelectedIssue(issue);
    const body = issue.body ? `\n\n${issue.body}` : '';
    setTaskDesc(`Fix #${issue.number}: ${issue.title}${body}`);
    setDialogTab('task');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm uppercase tracking-wider">
            New Session
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          {/* Tab switcher */}
          <div className="flex gap-px border border-border bg-border">
            <button
              onClick={() => setDialogTab('task')}
              className={`flex-1 bg-background py-2 font-mono text-[10px] uppercase tracking-wider ${
                dialogTab === 'task' ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              Describe Task
            </button>
            <button
              onClick={() => {
                setDialogTab('issue');
                if (issues.length === 0) handleLoadIssues();
              }}
              className={`flex-1 bg-background py-2 font-mono text-[10px] uppercase tracking-wider ${
                dialogTab === 'issue' ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              From Issue
            </button>
          </div>

          {dialogTab === 'task' && (
            <>
              {selectedIssue && (
                <div className="flex items-center gap-2 overflow-hidden border border-border px-3 py-2">
                  <span className="font-mono text-[10px] text-muted-foreground">
                    #{selectedIssue.number}
                  </span>
                  <span className="truncate font-mono text-xs">{selectedIssue.title}</span>
                  <button
                    onClick={() => {
                      setSelectedIssue(null);
                      setTaskDesc('');
                    }}
                    className="ml-auto shrink-0 font-mono text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    &times;
                  </button>
                </div>
              )}
              <Textarea
                placeholder="Describe what you want to change..."
                value={taskDesc}
                onChange={(e) => setTaskDesc(e.target.value)}
                rows={4}
                className="font-mono text-sm"
              />
              {/* Constraints */}
              <div>
                <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Constraints (optional)
                </p>
                <div className="flex gap-2 overflow-hidden">
                  <input
                    placeholder="e.g. do not modify tests"
                    value={constraintInput}
                    onChange={(e) => setConstraintInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const v = constraintInput.trim();
                        if (v && !constraints.includes(v)) {
                          setConstraints([...constraints, v]);
                          setConstraintInput('');
                        }
                      }
                    }}
                    className="flex-1 border border-border bg-transparent px-3 py-1.5 font-mono text-xs outline-none focus:border-foreground/20"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const v = constraintInput.trim();
                      if (v && !constraints.includes(v)) {
                        setConstraints([...constraints, v]);
                        setConstraintInput('');
                      }
                    }}
                    className="border border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
                  >
                    Add
                  </button>
                </div>
                {constraints.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {constraints.map((c) => (
                      <span
                        key={c}
                        className="flex items-center gap-1 border border-border px-2 py-0.5 font-mono text-[10px]"
                      >
                        {c}
                        <button
                          onClick={() => setConstraints(constraints.filter((x) => x !== c))}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <Button
                onClick={handleCreateSession}
                disabled={creating || !taskDesc.trim()}
                className="w-full"
              >
                <span className="font-mono text-xs uppercase tracking-wider">
                  {creating ? 'Creating...' : 'Create Session'}
                </span>
              </Button>
            </>
          )}

          {dialogTab === 'issue' && (
            <div>
              {issuesLoading ? (
                <div className="flex justify-center py-8">
                  <div className="h-4 w-4 animate-spin border border-foreground border-t-transparent" />
                </div>
              ) : issues.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-xs text-muted-foreground">
                    No open issues found. Make sure this repo is on GitHub.
                  </p>
                </div>
              ) : (
                <div className="max-h-[300px] divide-y divide-border overflow-y-auto border border-border">
                  {issues.map((issue) => (
                    <button
                      key={issue.number}
                      onClick={() => handleSelectIssue(issue)}
                      className="flex w-full items-start gap-3 p-3 text-left transition-colors hover:bg-accent"
                    >
                      <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                        #{issue.number}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-xs">{issue.title}</p>
                        {issue.labels.length > 0 && (
                          <div className="mt-1 flex gap-1">
                            {issue.labels.map((l) => (
                              <span
                                key={l}
                                className="border border-border px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground"
                              >
                                {l}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
