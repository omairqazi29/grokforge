'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.repos
      .list()
      .then((repos) => {
        if (repos.length > 0) {
          router.replace(`/repos/${repos[0].id}`);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-4 w-4 animate-spin border border-foreground border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="max-w-xl text-center">
        <p
          className="mb-8 font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground"
          style={{ animation: 'fadeIn 0.8s ease-out 0.1s both' }}
        >
          Repo-Aware Coding Workspace
        </p>
        <h1
          className="font-mono text-5xl font-light leading-[1.1] tracking-tight"
          style={{ animation: 'fadeIn 1s ease-out 0.3s both' }}
        >
          Engineer
          <br />
          with Grok
        </h1>
        <p
          className="mx-auto mt-8 max-w-md text-sm leading-[1.8] text-muted-foreground"
          style={{ animation: 'fadeIn 1s ease-out 0.6s both' }}
        >
          Connect a repository from the sidebar to start planning, patching, and reviewing code.
        </p>
      </div>
    </div>
  );
}
