'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FileTree } from '@/components/file-tree';
import { api, Repository, Session } from '@/lib/api-client';

export default function RepoPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const repoId = Number(params.id);

  const [repo, setRepo] = useState<Repository | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [taskDesc, setTaskDesc] = useState('');
  const [creating, setCreating] = useState(false);

  // Auto-create session from validation error highlight
  useEffect(() => {
    const autoCreate = searchParams.get('autoCreate');
    const task = searchParams.get('task');
    if (autoCreate === 'true' && task) {
      setTaskDesc(decodeURIComponent(task));
      setDialogOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    Promise.all([api.repos.get(repoId), api.sessions.list(repoId)])
      .then(([r, s]) => {
        setRepo(r);
        setSessions(s);
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
      router.push(`/sessions/${session.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
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
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="font-mono text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
            >
              &larr; Repos
            </button>
            <span className="text-border">|</span>
            <span className="font-mono text-sm font-medium">{repo.name}</span>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger render={<Button size="sm" />}>
              <span className="font-mono text-xs uppercase tracking-wider">New Session</span>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-mono text-sm uppercase tracking-wider">
                  New Session
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <label className="mb-1.5 block font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    What do you want to change?
                  </label>
                  <Textarea
                    placeholder="Describe what you want to change..."
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                    rows={4}
                    className="font-mono text-sm"
                  />
                </div>
                <Button onClick={handleCreateSession} disabled={creating} className="w-full">
                  <span className="font-mono text-xs uppercase tracking-wider">
                    {creating ? 'Creating...' : 'Create'}
                  </span>
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-6 pt-24 pb-16">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left: Repo info + Sessions */}
          <div className="lg:col-span-2 space-y-8">
            {/* Repo Summary */}
            <div className="border border-border p-6">
              <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Repository
              </p>
              <p className="mb-2 font-mono text-xs text-muted-foreground">{repo.path}</p>
              <p className="text-sm leading-relaxed">{repo.summary}</p>
              <div className="mt-4 flex gap-6 text-xs text-muted-foreground">
                <span>{repo.file_tree.length} files</span>
                <span>{Object.keys(repo.symbol_index).length} indexed</span>
                <span>{Object.values(repo.symbol_index).flat().length} symbols</span>
              </div>
            </div>

            {/* P1: Session History */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Sessions
                </p>
                <span className="font-mono text-xs text-muted-foreground">
                  {sessions.length} total
                </span>
              </div>

              {sessions.length === 0 ? (
                <div className="border border-border p-8 text-center">
                  <p className="mb-4 text-sm text-muted-foreground">No sessions yet</p>
                  <Button onClick={() => setDialogOpen(true)}>
                    <span className="font-mono text-xs uppercase tracking-wider">
                      Create First Session
                    </span>
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-border border border-border">
                  {sessions.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => router.push(`/sessions/${s.id}`)}
                      className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-accent"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-mono text-sm">{s.title}</p>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {s.task_description}
                        </p>
                      </div>
                      <div className="ml-4 flex items-center gap-3">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                          {STATUS_MAP[s.status] || s.status}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: File Tree + Repo Graph */}
          <div className="space-y-6">
            <div className="border border-border">
              <div className="border-b border-border p-4">
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  File Tree
                </p>
              </div>
              <div className="h-[500px] p-2">
                <FileTree files={repo.file_tree} symbolIndex={repo.symbol_index} />
              </div>
            </div>

            {/* P2: Repo Memory / Dependency Graph Preview */}
            <div className="border border-border p-6">
              <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Dependency Graph
              </p>
              <div className="space-y-2">
                {Object.entries(repo.symbol_index)
                  .slice(0, 8)
                  .map(([file, symbols]) => (
                    <div key={file} className="flex items-start justify-between gap-2">
                      <span className="truncate font-mono text-xs text-muted-foreground">
                        {file}
                      </span>
                      <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                        {symbols.length}
                      </span>
                    </div>
                  ))}
                {Object.keys(repo.symbol_index).length > 8 && (
                  <p className="font-mono text-[10px] text-muted-foreground">
                    +{Object.keys(repo.symbol_index).length - 8} more files
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
