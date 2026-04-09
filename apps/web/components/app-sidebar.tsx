'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { api, Repository, Session, BranchInfo } from '@/lib/api-client';

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [repos, setRepos] = useState<Repository[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [currentBranch, setCurrentBranch] = useState<string | null>(null);
  const [activeRepoId, setActiveRepoId] = useState<number | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);

  const [addRepoOpen, setAddRepoOpen] = useState(false);
  const [repoPath, setRepoPath] = useState('');
  const [adding, setAdding] = useState(false);
  const [newBranchOpen, setNewBranchOpen] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');

  // Derive active IDs from URL
  useEffect(() => {
    const repoMatch = pathname.match(/\/repos\/(\d+)/);
    const sessionMatch = pathname.match(/\/sessions\/(\d+)/);
    if (repoMatch) setActiveRepoId(Number(repoMatch[1]));
    if (sessionMatch) setActiveSessionId(Number(sessionMatch[1]));
  }, [pathname]);

  // Load repos
  useEffect(() => {
    api.repos.list().then(setRepos).catch(console.error);
  }, []);

  // Load sessions + branches when active repo changes
  useEffect(() => {
    if (!activeRepoId) return;
    api.sessions.list(activeRepoId).then(setSessions).catch(console.error);
    api.branches
      .list(activeRepoId)
      .then(setBranches)
      .catch(() => setBranches([]));
    api.branches
      .current(activeRepoId)
      .then((r) => setCurrentBranch(r.branch))
      .catch(() => {});
  }, [activeRepoId]);

  // Also derive repo from session
  useEffect(() => {
    if (activeSessionId && !activeRepoId) {
      api.sessions
        .get(activeSessionId)
        .then((s) => setActiveRepoId(s.repository_id))
        .catch(() => {});
    }
  }, [activeSessionId]);

  const handleAddRepo = async () => {
    if (!repoPath.trim()) return;
    setAdding(true);
    try {
      const repo = await api.repos.create(repoPath.trim());
      setRepos((prev) => [...prev, repo]);
      setRepoPath('');
      setAddRepoOpen(false);
      router.push(`/repos/${repo.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  const handleCheckout = async (branch: string) => {
    if (!activeRepoId) return;
    await api.branches.checkout(activeRepoId, branch);
    setCurrentBranch(branch);
    setBranches((prev) => prev.map((b) => ({ ...b, is_current: b.name === branch })));
  };

  const handleCreateBranch = async () => {
    if (!activeRepoId || !newBranchName.trim()) return;
    await api.branches.create(activeRepoId, newBranchName.trim());
    setCurrentBranch(newBranchName.trim());
    setNewBranchName('');
    setNewBranchOpen(false);
    api.branches
      .list(activeRepoId)
      .then(setBranches)
      .catch(() => {});
  };

  const STATUS_SHORT: Record<string, string> = {
    created: 'NEW',
    planning: 'PLAN',
    planned: 'PLAN',
    patching: 'PATCH',
    reviewing: 'REV',
    validating: 'TEST',
    completed: 'DONE',
  };

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-56 flex-col border-r border-border bg-background">
      {/* Logo */}
      <div className="border-b border-border px-4 py-4">
        <button onClick={() => router.push('/')} className="block">
          <span className="font-mono text-xs font-medium uppercase tracking-[0.2em]">
            GrokForge
          </span>
        </button>
      </div>

      <ScrollArea className="flex-1">
        {/* Repos */}
        <div className="px-2 pt-3">
          <div className="flex items-center justify-between px-2 pb-2">
            <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
              Repos
            </span>
            <button
              onClick={() => setAddRepoOpen(true)}
              className="font-mono text-[10px] text-muted-foreground hover:text-foreground"
            >
              +
            </button>
          </div>
          {repos.map((repo) => (
            <button
              key={repo.id}
              onClick={() => {
                setActiveRepoId(repo.id);
                router.push(`/repos/${repo.id}`);
              }}
              className={`mb-0.5 block w-full truncate px-2 py-1.5 text-left font-mono text-xs transition-colors ${
                activeRepoId === repo.id
                  ? 'bg-accent text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {repo.name}
            </button>
          ))}
        </div>

        {/* Branch indicator */}
        {activeRepoId && currentBranch && (
          <div className="border-t border-border px-2 pt-3">
            <div className="flex items-center justify-between px-2 pb-2">
              <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                Branch
              </span>
              <button
                onClick={() => setNewBranchOpen(true)}
                className="font-mono text-[10px] text-muted-foreground hover:text-foreground"
              >
                +
              </button>
            </div>
            {branches.map((b) => (
              <button
                key={b.name}
                onClick={() => handleCheckout(b.name)}
                className={`mb-0.5 flex w-full items-center gap-1.5 truncate px-2 py-1 text-left font-mono text-[11px] transition-colors ${
                  b.is_current ? 'text-foreground' : 'text-foreground/30 hover:text-foreground/60'
                }`}
              >
                {b.is_current && <span className="h-1 w-1 shrink-0 bg-foreground" />}
                {b.name}
              </button>
            ))}
          </div>
        )}

        {/* Sessions */}
        {activeRepoId && (
          <div className="border-t border-border px-2 pt-3">
            <div className="flex items-center justify-between px-2 pb-2">
              <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                Sessions
              </span>
              <button
                onClick={() => router.push(`/repos/${activeRepoId}`)}
                className="font-mono text-[10px] text-muted-foreground hover:text-foreground"
              >
                +
              </button>
            </div>
            {sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => router.push(`/sessions/${s.id}`)}
                className={`mb-0.5 flex w-full items-center justify-between px-2 py-1.5 text-left transition-colors ${
                  activeSessionId === s.id
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="truncate font-mono text-[11px]">{s.title}</span>
                <span className="ml-1 shrink-0 font-mono text-[8px] uppercase tracking-wider text-foreground/30">
                  {STATUS_SHORT[s.status] || s.status}
                </span>
              </button>
            ))}
            {sessions.length === 0 && (
              <p className="px-2 py-2 font-mono text-[10px] text-foreground/20">No sessions</p>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Bottom nav */}
      <div className="border-t border-border p-2">
        <button
          onClick={() => router.push('/settings')}
          className="block w-full px-2 py-1.5 text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
        >
          Settings
        </button>
      </div>

      {/* Add repo dialog */}
      <Dialog open={addRepoOpen} onOpenChange={setAddRepoOpen}>
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
            <Button onClick={handleAddRepo} disabled={adding} className="w-full">
              <span className="font-mono text-xs uppercase tracking-wider">
                {adding ? 'Scanning...' : 'Scan & Connect'}
              </span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New branch dialog */}
      <Dialog open={newBranchOpen} onOpenChange={setNewBranchOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-mono text-sm uppercase tracking-wider">
              Create Branch
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                From: {currentBranch}
              </p>
              <Input
                placeholder="feature/my-branch"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateBranch()}
                className="font-mono text-sm"
              />
            </div>
            <Button onClick={handleCreateBranch} className="w-full">
              <span className="font-mono text-xs uppercase tracking-wider">Create & Checkout</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
