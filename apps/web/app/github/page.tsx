'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { api, GitHubUser, GitHubRepo } from '@/lib/api-client';

export default function GitHubPage() {
  const router = useRouter();
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [cloning, setCloning] = useState<string | null>(null);
  const [cloneResult, setCloneResult] = useState<{ repo: string; path: string } | null>(null);

  useEffect(() => {
    api.github
      .user()
      .then((u) => {
        setUser(u);
        return api.github.repos(50);
      })
      .then(setRepos)
      .catch(() => setAuthError(true))
      .finally(() => setLoading(false));
  }, []);

  const handleClone = async (repo: GitHubRepo) => {
    setCloning(repo.full_name);
    try {
      const result = await api.github.clone(repo.full_name);
      setCloneResult({ repo: repo.full_name, path: result.path });
      // Auto-connect as GrokForge repo
      const connected = await api.repos.create(result.path);
      router.push(`/repos/${connected.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setCloning(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-4 w-4 animate-spin border border-foreground border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <nav className="fixed top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
            >
              &larr; Home
            </button>
            <span className="text-border">|</span>
            <span className="font-mono text-sm uppercase tracking-[0.2em]">GitHub</span>
          </div>
          {user && (
            <div className="flex items-center gap-3">
              {user.avatar_url && <img src={user.avatar_url} alt="" className="h-6 w-6" />}
              <span className="font-mono text-xs text-muted-foreground">{user.login}</span>
            </div>
          )}
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-6 pt-24 pb-16">
        {authError ? (
          <div className="border border-border p-12 text-center">
            <p className="mb-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Not Connected
            </p>
            <p className="mb-6 text-sm text-muted-foreground">
              Run{' '}
              <code className="border border-border px-2 py-0.5 font-mono text-xs">
                gh auth login
              </code>{' '}
              in your terminal to connect GitHub.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Your Repositories &middot; {repos.length}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Click a repo to clone and connect it to GrokForge
              </p>
            </div>

            <div className="divide-y divide-border border border-border">
              {repos.map((repo) => (
                <div
                  key={repo.full_name}
                  className="flex items-center justify-between p-4 transition-colors hover:bg-accent"
                >
                  <div>
                    <p className="font-mono text-sm">{repo.full_name}</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{repo.default_branch}</span>
                      {repo.private && <span className="text-yellow-400/70">private</span>}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleClone(repo)}
                    disabled={cloning === repo.full_name}
                  >
                    <span className="font-mono text-[10px] uppercase tracking-wider">
                      {cloning === repo.full_name ? 'Cloning...' : 'Clone & Connect'}
                    </span>
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
