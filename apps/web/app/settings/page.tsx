'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { api, GitHubUser, GitHubRepo, TokenSummary } from '@/lib/api-client';

export default function SettingsPage() {
  const router = useRouter();
  const [ghUser, setGhUser] = useState<GitHubUser | null>(null);
  const [ghRepos, setGhRepos] = useState<GitHubRepo[]>([]);
  const [tokenSummary, setTokenSummary] = useState<TokenSummary | null>(null);
  const [ghError, setGhError] = useState(false);
  const [cloning, setCloning] = useState<string | null>(null);

  useEffect(() => {
    api.github
      .user()
      .then(setGhUser)
      .catch(() => setGhError(true));
    api.github
      .repos(30)
      .then(setGhRepos)
      .catch(() => {});
    api.tokens
      .summary()
      .then(setTokenSummary)
      .catch(() => {});
  }, []);

  const handleClone = async (repo: GitHubRepo) => {
    setCloning(repo.full_name);
    try {
      const result = await api.github.clone(repo.full_name);
      const connected = await api.repos.create(result.path);
      router.push(`/repos/${connected.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setCloning(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <p className="mb-8 font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
        Settings
      </p>

      {/* Token Usage */}
      <div className="mb-10">
        <p className="mb-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Grok API Usage
        </p>
        {tokenSummary ? (
          <div className="grid grid-cols-4 gap-px border border-border bg-border">
            {[
              { label: 'Requests', value: tokenSummary.request_count },
              { label: 'Tokens', value: tokenSummary.total_tokens.toLocaleString() },
              { label: 'Cost', value: `$${tokenSummary.total_cost_usd.toFixed(4)}` },
              {
                label: 'Avg/req',
                value: tokenSummary.request_count
                  ? Math.round(tokenSummary.total_tokens / tokenSummary.request_count)
                  : 0,
              },
            ].map((c) => (
              <div key={c.label} className="bg-background p-4">
                <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                  {c.label}
                </p>
                <p className="mt-1 font-mono text-lg">{c.value}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No usage data</p>
        )}
        <button
          onClick={() => router.push('/dashboard')}
          className="mt-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
        >
          View Full Dashboard &rarr;
        </button>
      </div>

      {/* GitHub */}
      <div>
        <p className="mb-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          GitHub
        </p>
        {ghError ? (
          <div className="border border-border p-6">
            <p className="mb-2 text-xs text-muted-foreground">Not connected.</p>
            <p className="font-mono text-xs text-muted-foreground">
              Run <code className="border border-border px-1.5 py-0.5">gh auth login</code> to
              connect.
            </p>
          </div>
        ) : (
          <>
            {ghUser && (
              <div className="mb-4 flex items-center gap-3 border border-border p-3">
                {ghUser.avatar_url && <img src={ghUser.avatar_url} alt="" className="h-6 w-6" />}
                <span className="font-mono text-xs">{ghUser.login}</span>
                {ghUser.name && (
                  <span className="font-mono text-xs text-muted-foreground">{ghUser.name}</span>
                )}
              </div>
            )}
            <div className="max-h-[400px] overflow-y-auto divide-y divide-border border border-border">
              {ghRepos.map((repo) => (
                <div
                  key={repo.full_name}
                  className="flex items-center justify-between p-3 hover:bg-accent"
                >
                  <div>
                    <p className="font-mono text-xs">{repo.full_name}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">
                      {repo.default_branch}
                      {repo.private && ' · private'}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleClone(repo)}
                    disabled={cloning === repo.full_name}
                  >
                    <span className="font-mono text-[9px] uppercase tracking-wider">
                      {cloning === repo.full_name ? 'Cloning...' : 'Clone'}
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
