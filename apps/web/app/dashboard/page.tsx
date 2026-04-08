'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { api, TokenSummary, TokenUsage } from '@/lib/api-client';

export default function DashboardPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<TokenSummary | null>(null);
  const [usage, setUsage] = useState<TokenUsage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.tokens.summary(), api.tokens.list()])
      .then(([s, u]) => {
        setSummary(s);
        setUsage(u);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-4 w-4 animate-spin border border-foreground border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
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
            <span className="font-mono text-sm font-medium uppercase tracking-[0.2em]">
              Token Dashboard
            </span>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-6 pt-24 pb-16">
        {/* Summary Cards */}
        <div className="mb-12 grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-4">
          {[
            {
              label: 'Total Tokens',
              value: summary?.total_tokens?.toLocaleString() || '0',
            },
            {
              label: 'Prompt',
              value: summary?.total_prompt_tokens?.toLocaleString() || '0',
            },
            {
              label: 'Completion',
              value: summary?.total_completion_tokens?.toLocaleString() || '0',
            },
            {
              label: 'Cost',
              value: `$${(summary?.total_cost_usd || 0).toFixed(4)}`,
            },
          ].map((card) => (
            <div key={card.label} className="bg-background p-6">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {card.label}
              </p>
              <p className="font-mono text-2xl font-light">{card.value}</p>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mb-8">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
            API Requests &middot; {summary?.request_count || 0} total
          </p>
        </div>

        {/* Usage Table */}
        {usage.length > 0 ? (
          <div className="border border-border">
            <div className="grid grid-cols-6 gap-px border-b border-border bg-border">
              {['Operation', 'Model', 'Prompt', 'Completion', 'Total', 'Cost'].map((h) => (
                <div key={h} className="bg-background px-4 py-3">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {h}
                  </p>
                </div>
              ))}
            </div>
            {usage.map((u) => (
              <div
                key={u.id}
                className="grid grid-cols-6 gap-px border-b border-border bg-border last:border-b-0"
              >
                <div className="bg-background px-4 py-3">
                  <p className="font-mono text-xs">{u.operation}</p>
                </div>
                <div className="bg-background px-4 py-3">
                  <p className="font-mono text-xs text-muted-foreground">{u.model}</p>
                </div>
                <div className="bg-background px-4 py-3">
                  <p className="font-mono text-xs">{u.prompt_tokens.toLocaleString()}</p>
                </div>
                <div className="bg-background px-4 py-3">
                  <p className="font-mono text-xs">{u.completion_tokens.toLocaleString()}</p>
                </div>
                <div className="bg-background px-4 py-3">
                  <p className="font-mono text-xs">{u.total_tokens.toLocaleString()}</p>
                </div>
                <div className="bg-background px-4 py-3">
                  <p className="font-mono text-xs">${u.cost_usd.toFixed(4)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-border p-12 text-center">
            <p className="text-sm text-muted-foreground">
              No API usage yet. Connect Grok with XAI_API_KEY to see token metrics.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
