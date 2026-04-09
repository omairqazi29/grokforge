'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CommitsList } from '@/components/commits-list';
import { FileTreePanel } from '@/components/file-tree-panel';
import { NewSessionDialog } from '@/components/new-session-dialog';
import { api, Repository, Session, CommitInfo } from '@/lib/api-client';

const STATUS_MAP: Record<string, string> = {
  created: 'NEW',
  planning: 'PLAN',
  planned: 'PLANNED',
  patching: 'PATCH',
  reviewing: 'REVIEW',
  validating: 'TEST',
  completed: 'DONE',
};

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
  const [taskDesc, setTaskDesc] = useState('');

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

  return (
    <div className="px-8 py-8">
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
        <div className="space-y-8 lg:col-span-2">
          <Button onClick={() => setDialogOpen(true)} className="w-full">
            <span className="font-mono text-xs uppercase tracking-[0.15em]">New Session</span>
          </Button>

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

          <CommitsList commits={commits} />
        </div>

        <FileTreePanel repo={repo} />
      </div>

      <NewSessionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        repo={repo}
        initialTask={taskDesc}
        onCreated={(id) => router.push(`/sessions/${id}`)}
      />
    </div>
  );
}
