'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api, Repository, Session, BranchInfo } from '@/lib/api-client';
import { SIDEBAR_CONFIG } from '@/lib/constants';

export function useSidebarData() {
  const router = useRouter();
  const pathname = usePathname();
  const [repos, setRepos] = useState<Repository[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [currentBranch, setCurrentBranch] = useState<string | null>(null);
  const [activeRepoId, setActiveRepoId] = useState<number | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [checkoutError, setCheckoutError] = useState('');

  const refreshBranches = useCallback((repoId: number) => {
    api.branches
      .list(repoId)
      .then(setBranches)
      .catch(() => setBranches([]));
    api.branches
      .current(repoId)
      .then((r) => setCurrentBranch(r.branch))
      .catch(() => {});
  }, []);

  // Derive active IDs from URL
  useEffect(() => {
    const repoMatch = pathname.match(/\/repos\/(\d+)/);
    const sessionMatch = pathname.match(/\/sessions\/(\d+)/);
    if (repoMatch) setActiveRepoId(Number(repoMatch[1]));
    if (sessionMatch) setActiveSessionId(Number(sessionMatch[1]));
  }, [pathname]);

  useEffect(() => {
    api.repos.list().then(setRepos).catch(console.error);
  }, []);

  const refreshSessions = useCallback(() => {
    if (!activeRepoId) return;
    api.sessions.list(activeRepoId).then(setSessions).catch(console.error);
  }, [activeRepoId]);

  useEffect(() => {
    if (!activeRepoId) return;
    refreshSessions();
    refreshBranches(activeRepoId);
  }, [activeRepoId, refreshSessions, refreshBranches]);

  useEffect(() => {
    const interval = setInterval(() => {
      api.repos
        .list()
        .then(setRepos)
        .catch(() => {});
      refreshSessions();
      if (activeRepoId) refreshBranches(activeRepoId);
    }, SIDEBAR_CONFIG.POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refreshSessions, refreshBranches, activeRepoId]);

  useEffect(() => {
    if (activeSessionId && !activeRepoId) {
      api.sessions
        .get(activeSessionId)
        .then((s) => setActiveRepoId(s.repository_id))
        .catch(() => {});
    }
  }, [activeSessionId, activeRepoId]);

  const addRepo = async (mode: 'path' | 'url', value: string) => {
    const path = mode === 'url' ? (await api.github.clone(value.trim())).path : value.trim();
    const repo = await api.repos.create(path);
    setRepos((prev) => [...prev, repo]);
    router.push(`/repos/${repo.id}`);
  };

  const deleteRepo = async (repoId: number) => {
    await api.repos.delete(repoId);
    setRepos((prev) => prev.filter((r) => r.id !== repoId));
    if (activeRepoId === repoId) {
      setActiveRepoId(null);
      router.push('/');
    }
  };

  const checkoutBranch = async (branch: string) => {
    if (!activeRepoId) return;
    setCheckoutError('');
    try {
      await api.branches.checkout(activeRepoId, branch);
      setCurrentBranch(branch);
      setBranches((prev) => prev.map((b) => ({ ...b, is_current: b.name === branch })));
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Checkout failed');
      setTimeout(() => setCheckoutError(''), 4000);
    }
  };

  const createBranch = async (name: string) => {
    if (!activeRepoId || !name.trim()) return;
    await api.branches.create(activeRepoId, name.trim());
    setCurrentBranch(name.trim());
    refreshBranches(activeRepoId);
  };

  return {
    repos,
    sessions,
    branches,
    currentBranch,
    activeRepoId,
    activeSessionId,
    checkoutError,
    refreshSessions,
    setActiveRepoId,
    addRepo,
    deleteRepo,
    checkoutBranch,
    createBranch,
  };
}
