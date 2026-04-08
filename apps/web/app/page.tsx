'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { api, Repository } from '@/lib/api-client';

export default function Home() {
  const router = useRouter();
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [repoPath, setRepoPath] = useState('');
  const [adding, setAdding] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.repos
      .list()
      .then(setRepos)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleAddRepo = async () => {
    if (!repoPath.trim()) return;
    setAdding(true);
    setError('');
    try {
      const repo = await api.repos.create(repoPath.trim());
      setRepos((prev) => [...prev, repo]);
      setRepoPath('');
      setDialogOpen(false);
      router.push(`/repos/${repo.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add repository');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">G</span>
            </div>
            <h1 className="text-xl font-semibold">GrokForge</h1>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger render={<Button />}>Add Repository</DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a Repository</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Input
                    placeholder="/path/to/your/repository"
                    value={repoPath}
                    onChange={(e) => setRepoPath(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddRepo()}
                  />
                  {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
                </div>
                <Button onClick={handleAddRepo} disabled={adding} className="w-full">
                  {adding ? 'Scanning...' : 'Scan & Add'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-5 w-1/2 rounded bg-muted" />
                  <div className="mt-2 h-4 w-3/4 rounded bg-muted" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : repos.length === 0 ? (
          <div className="py-20 text-center">
            <h2 className="mb-2 text-2xl font-semibold">No repositories yet</h2>
            <p className="mb-6 text-muted-foreground">
              Add a local repository to start planning, patching, and reviewing code changes.
            </p>
            <Button onClick={() => setDialogOpen(true)}>Add Your First Repository</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {repos.map((repo) => (
              <Card
                key={repo.id}
                className="cursor-pointer transition-colors hover:border-primary/50"
                onClick={() => router.push(`/repos/${repo.id}`)}
              >
                <CardHeader>
                  <CardTitle className="text-lg">{repo.name}</CardTitle>
                  <CardDescription className="truncate">{repo.path}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{repo.file_tree.length} files</Badge>
                    <Badge variant="outline">{Object.keys(repo.symbol_index).length} indexed</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
