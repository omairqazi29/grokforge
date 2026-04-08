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
import { Separator } from '@/components/ui/separator';
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
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-sm">
              <span className="text-sm font-bold text-primary-foreground">G</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-none">GrokForge</h1>
              <p className="text-xs text-muted-foreground">by xAI</p>
            </div>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger render={<Button size="sm" />}>Add Repository</DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Connect a Repository</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Local Path</label>
                  <Input
                    placeholder="/Users/you/projects/your-repo"
                    value={repoPath}
                    onChange={(e) => setRepoPath(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddRepo()}
                    className="font-mono text-sm"
                  />
                  {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
                </div>
                <Button onClick={handleAddRepo} disabled={adding} className="w-full">
                  {adding ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Scanning repository...
                    </span>
                  ) : (
                    'Scan & Connect'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Hero (shown when no repos) */}
      {!loading && repos.length === 0 && (
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
          <div className="relative mx-auto max-w-6xl px-6 py-20 text-center">
            <Badge variant="secondary" className="mb-4">
              Powered by Grok
            </Badge>
            <h2 className="mx-auto max-w-2xl text-4xl font-bold tracking-tight">
              Your repo-aware
              <br />
              <span className="text-primary">coding workspace</span>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-lg text-muted-foreground">
              Plan tasks, generate patches, run validation, and review diffs — all in one loop.
              Connect a repo to start engineering.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Button size="lg" onClick={() => setDialogOpen(true)}>
                Connect Repository
              </Button>
            </div>

            {/* Feature pills */}
            <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                {
                  title: 'Workspace',
                  desc: 'Plan, patch, validate, review',
                  icon: '\u2692',
                },
                {
                  title: 'Lens',
                  desc: 'Repo graph, symbols, architecture',
                  icon: '\uD83D\uDD0D',
                },
                {
                  title: 'Ops',
                  desc: 'Autonomous PRs from issues',
                  icon: '\u26A1',
                },
              ].map((f) => (
                <Card key={f.title} className="text-left">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <span>{f.icon}</span>
                      {f.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Repos grid */}
      {!loading && repos.length > 0 && (
        <main className="mx-auto max-w-6xl px-6 py-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Repositories</h2>
              <p className="text-sm text-muted-foreground">
                {repos.length} connected {repos.length === 1 ? 'repo' : 'repos'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {repos.map((repo) => (
              <Card
                key={repo.id}
                className="group cursor-pointer transition-all hover:border-primary/40 hover:shadow-md"
                onClick={() => router.push(`/repos/${repo.id}`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base group-hover:text-primary transition-colors">
                      {repo.name}
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {Object.keys(repo.symbol_index).length} modules
                    </Badge>
                  </div>
                  <CardDescription className="truncate font-mono text-xs">
                    {repo.path}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Separator className="mb-3" />
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{repo.file_tree.length} files</span>
                    <span>&#183;</span>
                    <span>{Object.values(repo.symbol_index).flat().length} symbols</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      )}

      {/* Loading state */}
      {loading && (
        <main className="mx-auto max-w-6xl px-6 py-8">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-5 w-1/2 rounded bg-muted" />
                  <div className="mt-2 h-4 w-3/4 rounded bg-muted" />
                </CardHeader>
                <CardContent>
                  <div className="h-3 w-1/3 rounded bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      )}
    </div>
  );
}
