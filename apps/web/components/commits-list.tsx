import { CommitInfo } from '@/lib/api-client';

export function CommitsList({ commits }: { commits: CommitInfo[] }) {
  if (commits.length === 0) return null;
  return (
    <div>
      <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        Recent Commits
      </p>
      <div className="divide-y divide-border border border-border">
        {commits.map((c) => (
          <div key={c.sha} className="flex items-start gap-3 p-3">
            <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{c.sha}</span>
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
  );
}
