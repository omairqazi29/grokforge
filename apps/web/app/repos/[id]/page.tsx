'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileTree } from '@/components/file-tree';
import { api, Repository, Session, CommitInfo, GitHubIssue } from '@/lib/api-client';

export default function RepoPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const repoId = Number(params.id);

  const [repo, setRepo] = useState<Repository | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [commits, setCommits] = useState<CommitInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTab, setDialogTab] = useState<'task' | 'issue'>('task');
  const [taskDesc, setTaskDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [issuesLoading, setIssuesLoading] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<GitHubIssue | null>(null);

  useEffect(() => {
    const autoCreate = searchParams.get('autoCreate');
    const task = searchParams.get('task');
    if (autoCreate === 'true' && task) {
      setTaskDesc(decodeURIComponent(task));
      setDialogOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    Promise.all([
      api.repos.get(repoId),
      api.sessions.list(repoId),
      api.branches.commits(repoId, 15),
    ])
      .then(([r, s, c]) => {
        setRepo(r);
        setSessions(s);
        setCommits(c);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [repoId]);

  const handleCreateSession = async () => {
    if (!taskDesc.trim()) return;
    setCreating(true);
    const task = taskDesc.trim();
    const autoTitle = task.length > 60 ? task.slice(0, 57) + '...' : task;
    try {
      const session = await api.sessions.create({
        repository_id: repoId,
        title: autoTitle,
        task_description: task,
      });
      setDialogOpen(false);
      setTaskDesc('');
      setSelectedIssue(null);
      router.push(`/sessions/${session.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleLoadIssues = async () => {
    if (!repo) return;
    setIssuesLoading(true);
    try {
      // Try to get GitHub remote name from repo path
      const repoName = repo.name;
      // Try common patterns: check if gh can list issues
      const ghRepos = await api.github.repos(100);
      const match = ghRepos.find(
        (r) => r.full_name.endsWith('/' + repoName) || r.full_name.includes(repoName),
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-4 w-4 animate-spin border border-foreground border-t-transparent" />
      </div>
    );
  }

  if (!repo) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Repository not found
        </p>
      </div>
    );
  }

  const STATUS_MAP: Record<string, string> = {
    created: 'NEW',
    planning: 'PLAN',
    planned: 'PLANNED',
    patching: 'PATCH',
    reviewing: 'REVIEW',
    validating: 'TEST',
    completed: 'DONE',
  };

  return (
    <div className="px-8 py-8">
      {/* Repo header */}
      <div className="mb-8 border-b border-border pb-6">
        <p className="font-mono text-lg">{repo.name}</p>
        <p className="mt-1 font-mono text-xs text-muted-foreground">{repo.path}</p>
        <p className="mt-3 text-sm leading-relaxed text-foreground/70">{repo.summary}</p>
        <div className="mt-3 flex gap-6 font-mono text-xs text-muted-foreground">
          <span>{repo.file_tree.length} files</span>
          <span>{Object.keys(repo.symbol_index).length} indexed</span>
          <span>{Object.values(repo.symbol_index).flat().length} symbols</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left: Sessions + Commits */}
        <div className="space-y-8 lg:col-span-2">
          {/* New session button */}
          <Button onClick={() => setDialogOpen(true)} className="w-full">
            <span className="font-mono text-xs uppercase tracking-[0.15em]">New Session</span>
          </Button>

          {/* Sessions */}
          <div>
            <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Sessions &middot; {sessions.length}
            </p>
            {sessions.length === 0 ? (
              <div className="border border-border p-8 text-center">
                <p className="text-xs text-muted-foreground">No sessions yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border border border-border">
                {sessions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => router.push(`/sessions/${s.id}`)}
                    className="flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-accent"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-xs">{s.title}</p>
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        {s.task_description}
                      </p>
                    </div>
                    <span className="ml-3 shrink-0 font-mono text-[8px] uppercase tracking-widest text-foreground/30">
                      {STATUS_MAP[s.status] || s.status}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Commits */}
          {commits.length > 0 && (
            <div>
              <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Recent Commits
              </p>
              <div className="divide-y divide-border border border-border">
                {commits.map((c) => (
                  <div key={c.sha} className="flex items-start gap-3 p-3">
                    <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                      {c.sha}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-xs">{c.message}</p>
                      <p className="mt-0.5 font-mono text-[10px] text-foreground/30">
                        {c.author} &middot; {new Date(c.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: File Tree + Deps */}
        <div className="space-y-6">
          <div className="border border-border">
            <div className="border-b border-border p-3">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Files
              </p>
            </div>
            <div className="h-[400px] p-1">
              <FileTree files={repo.file_tree} symbolIndex={repo.symbol_index} />
            </div>
          </div>

          <div className="border border-border p-4">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Modules
            </p>
            <div className="space-y-1.5">
              {Object.entries(repo.symbol_index)
                .slice(0, 10)
                .map(([file, symbols]) => (
                  <div key={file} className="flex items-start justify-between gap-2">
                    <span className="truncate font-mono text-[10px] text-muted-foreground">
                      {file}
                    </span>
                    <span className="shrink-0 font-mono text-[9px] text-foreground/20">
                      {symbols.length}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* New session dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
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
                  <div className="flex items-center gap-2 border border-border px-3 py-2">
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
    </div>
  );
}
