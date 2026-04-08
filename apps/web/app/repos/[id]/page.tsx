'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { FileTree } from '@/components/file-tree';
import { api, Repository, Session } from '@/lib/api-client';

export default function RepoPage() {
  const params = useParams();
  const router = useRouter();
  const repoId = Number(params.id);

  const [repo, setRepo] = useState<Repository | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [creating, setCreating] = useState(false);

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
    if (!title.trim() || !taskDesc.trim()) return;
    setCreating(true);
    try {
      const session = await api.sessions.create({
        repository_id: repoId,
        title: title.trim(),
        task_description: taskDesc.trim(),
      });
      setDialogOpen(false);
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
        <p className="text-muted-foreground">Loading repository...</p>
      </div>
    );
  }

  if (!repo) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Repository not found</p>
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
              onClick={() => router.push('/')}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              &larr; Back
            </button>
            <Separator orientation="vertical" className="h-6" />
            <h1 className="text-xl font-semibold">{repo.name}</h1>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger render={<Button />}>New Session</DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a Session</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Title</label>
                  <Input
                    placeholder="Add retry logic to API client"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Task Description</label>
                  <Textarea
                    placeholder="Describe what you want to change..."
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                    rows={4}
                  />
                </div>
                <Button onClick={handleCreateSession} disabled={creating} className="w-full">
                  {creating ? 'Creating...' : 'Create Session'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left: Summary + Sessions */}
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Repository Summary</CardTitle>
                <CardDescription className="truncate">{repo.path}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{repo.summary}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="secondary">{repo.file_tree.length} files</Badge>
                  <Badge variant="outline">
                    {Object.keys(repo.symbol_index).length} indexed files
                  </Badge>
                  <Badge variant="outline">
                    {Object.values(repo.symbol_index).flat().length} symbols
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <div>
              <h2 className="mb-4 text-lg font-semibold">Sessions</h2>
              {sessions.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="mb-4 text-muted-foreground">No sessions yet</p>
                    <Button onClick={() => setDialogOpen(true)}>Create First Session</Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <Card
                      key={session.id}
                      className="cursor-pointer transition-colors hover:border-primary/50"
                      onClick={() => router.push(`/sessions/${session.id}`)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{session.title}</CardTitle>
                          <Badge variant="outline">{session.status}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="truncate text-sm text-muted-foreground">
                          {session.task_description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: File Tree */}
          <div>
            <Card className="h-[600px]">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">File Tree</CardTitle>
              </CardHeader>
              <CardContent className="h-[calc(100%-60px)] p-0 px-2">
                <FileTree files={repo.file_tree} symbolIndex={repo.symbol_index} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
