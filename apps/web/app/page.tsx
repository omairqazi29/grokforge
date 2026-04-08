'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <span className="font-mono text-sm font-medium uppercase tracking-[0.2em]">
              GrokForge
            </span>
            <span className="hidden text-[10px] uppercase tracking-widest text-muted-foreground sm:inline">
              by xAI
            </span>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="font-mono text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
          >
            Dashboard
          </button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger render={<Button size="sm" />}>
              <span className="font-mono text-xs uppercase tracking-wider">Connect Repo</span>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-mono text-sm uppercase tracking-wider">
                  Connect Repository
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Input
                  placeholder="/path/to/repository"
                  value={repoPath}
                  onChange={(e) => setRepoPath(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddRepo()}
                  className="font-mono text-sm"
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button onClick={handleAddRepo} disabled={adding} className="w-full">
                  <span className="font-mono text-xs uppercase tracking-wider">
                    {adding ? 'Scanning...' : 'Scan & Connect'}
                  </span>
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </nav>

      {/* Hero */}
      {!loading && repos.length === 0 && (
        <div className="flex min-h-screen flex-col items-center justify-center px-6 pt-16">
          <div className="max-w-3xl text-center">
            <p
              className="mb-8 font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground"
              style={{ animation: 'fadeIn 0.8s ease-out 0.1s both' }}
            >
              Repo-Aware Coding Workspace
            </p>
            <h1
              className="font-mono text-5xl font-light leading-[1.1] tracking-tight sm:text-7xl"
              style={{ animation: 'fadeIn 1s ease-out 0.3s both' }}
            >
              Engineer
              <br />
              with Grok
            </h1>
            <p
              className="mx-auto mt-8 max-w-lg text-base leading-[1.8] text-muted-foreground"
              style={{ animation: 'fadeIn 1s ease-out 0.6s both' }}
            >
              Plan tasks. Generate patches. Run validation. Review diffs.
              <br />
              All in one loop, powered by Grok&apos;s structured outputs.
            </p>
            <div
              className="mt-14 flex justify-center gap-4"
              style={{ animation: 'fadeIn 1s ease-out 0.9s both' }}
            >
              <Button size="lg" onClick={() => setDialogOpen(true)} className="px-10 py-3">
                <span className="font-mono text-xs uppercase tracking-[0.15em]">Get Started</span>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="px-10 py-3"
                onClick={() => window.open('https://github.com/omairqazi29/grokforge', '_blank')}
              >
                <span className="font-mono text-xs uppercase tracking-[0.15em]">View Source</span>
              </Button>
            </div>
          </div>

          {/* Three Layers */}
          <div className="mt-24 w-full max-w-5xl">
            <div className="grid grid-cols-1 gap-px border border-border bg-border md:grid-cols-3">
              {[
                {
                  title: 'Workspace',
                  desc: 'Interactive plan-patch-validate-review loop with structured AI output',
                },
                {
                  title: 'Lens',
                  desc: 'Symbol indexing, dependency tracking, and architecture summarization',
                },
                {
                  title: 'Ops',
                  desc: 'Autonomous PR generation from issues with evidence bundles',
                },
              ].map((f) => (
                <div key={f.title} className="bg-background p-8">
                  <h3 className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    {f.title}
                  </h3>
                  <p className="text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Capabilities */}
          <div className="mt-16 w-full max-w-5xl pb-24">
            <p className="mb-8 font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Capabilities
            </p>
            <div className="grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-3 lg:grid-cols-4">
              {[
                'Plan Generation',
                'Multi-file Patches',
                'Validation Runner',
                'Diff Review',
                'Session Memory',
                'Auto-fix Loop',
                'Token Dashboard',
                'GitHub PRs',
                'Repo Graph',
                'Dark Mode',
                'Cloud Ready',
                'Mobile Dispatch',
              ].map((f) => (
                <div key={f} className="bg-background px-4 py-6">
                  <p className="font-mono text-xs uppercase tracking-wider">{f}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Repos list */}
      {!loading && repos.length > 0 && (
        <main className="mx-auto max-w-7xl px-6 pt-24 pb-16">
          <div className="mb-8 flex items-end justify-between border-b border-border pb-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Repositories
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{repos.length} connected</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-px border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
            {repos.map((repo) => (
              <button
                key={repo.id}
                onClick={() => router.push(`/repos/${repo.id}`)}
                className="bg-background p-6 text-left transition-colors hover:bg-accent"
              >
                <p className="font-mono text-sm font-medium">{repo.name}</p>
                <p className="mt-1 truncate font-mono text-xs text-muted-foreground">{repo.path}</p>
                <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{repo.file_tree.length} files</span>
                  <span>{Object.values(repo.symbol_index).flat().length} symbols</span>
                </div>
              </button>
            ))}
          </div>
        </main>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex min-h-screen items-center justify-center pt-16">
          <div className="h-4 w-4 animate-spin border border-foreground border-t-transparent" />
        </div>
      )}
    </div>
  );
}
