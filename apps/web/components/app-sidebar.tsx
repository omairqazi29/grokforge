'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { api, Repository, Session, BranchInfo } from '@/lib/api-client';

const SIDEBAR_WIDTH = 224;
const SIDEBAR_MIN = 180;
const SIDEBAR_MAX = 360;

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [repos, setRepos] = useState<Repository[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [currentBranch, setCurrentBranch] = useState<string | null>(null);
  const [activeRepoId, setActiveRepoId] = useState<number | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);

  const [collapsed, setCollapsed] = useState(false);
  const [width, setWidth] = useState(SIDEBAR_WIDTH);
  const [resizing, setResizing] = useState(false);

  const [addRepoOpen, setAddRepoOpen] = useState(false);
  const [repoPath, setRepoPath] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [adding, setAdding] = useState(false);
  const [addMode, setAddMode] = useState<'path' | 'url'>('path');
  const [newBranchOpen, setNewBranchOpen] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [checkoutError, setCheckoutError] = useState('');

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
  const refreshSessions = useCallback(() => {
    if (!activeRepoId) return;
    api.sessions.list(activeRepoId).then(setSessions).catch(console.error);
  }, [activeRepoId]);

  useEffect(() => {
    if (!activeRepoId) return;
    refreshSessions();
    api.branches
      .list(activeRepoId)
      .then(setBranches)
      .catch(() => setBranches([]));
    api.branches
      .current(activeRepoId)
      .then((r) => setCurrentBranch(r.branch))
      .catch(() => {});
  }, [activeRepoId, refreshSessions]);

  // Refresh everything periodically
  useEffect(() => {
    const interval = setInterval(() => {
      api.repos
        .list()
        .then(setRepos)
        .catch(() => {});
      refreshSessions();
      if (activeRepoId) {
        api.branches
          .list(activeRepoId)
          .then(setBranches)
          .catch(() => {});
        api.branches
          .current(activeRepoId)
          .then((r) => setCurrentBranch(r.branch))
          .catch(() => {});
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [refreshSessions, activeRepoId]);

  // Derive repo from session
  useEffect(() => {
    if (activeSessionId && !activeRepoId) {
      api.sessions
        .get(activeSessionId)
        .then((s) => setActiveRepoId(s.repository_id))
        .catch(() => {});
    }
  }, [activeSessionId, activeRepoId]);

  const handleAddRepo = async () => {
    setAdding(true);
    try {
      if (addMode === 'url' && repoUrl.trim()) {
        const result = await api.github.clone(repoUrl.trim());
        const repo = await api.repos.create(result.path);
        setRepos((prev) => [...prev, repo]);
        setRepoUrl('');
        setAddRepoOpen(false);
        router.push(`/repos/${repo.id}`);
      } else if (addMode === 'path' && repoPath.trim()) {
        const repo = await api.repos.create(repoPath.trim());
        setRepos((prev) => [...prev, repo]);
        setRepoPath('');
        setAddRepoOpen(false);
        router.push(`/repos/${repo.id}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  const handleCheckout = async (branch: string) => {
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

  const handleCreateBranch = async () => {
    if (!activeRepoId || !newBranchName.trim()) return;
    try {
      await api.branches.create(activeRepoId, newBranchName.trim());
      setCurrentBranch(newBranchName.trim());
      setNewBranchName('');
      setNewBranchOpen(false);
      api.branches
        .list(activeRepoId)
        .then(setBranches)
        .catch(() => {});
    } catch (err) {
      console.error(err);
    }
  };

  // Resize handling
  const handleMouseDown = () => setResizing(true);
  useEffect(() => {
    if (!resizing) return;
    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(SIDEBAR_MIN, Math.min(SIDEBAR_MAX, e.clientX));
      setWidth(newWidth);
    };
    const handleMouseUp = () => setResizing(false);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing]);

  const STATUS_SHORT: Record<string, string> = {
    created: 'NEW',
    planning: 'PLAN',
    planned: 'PLAN',
    patching: 'PATCH',
    reviewing: 'REV',
    validating: 'TEST',
    completed: 'DONE',
  };

  const sidebarWidth = collapsed ? 48 : width;

  return (
    <>
      <aside
        className="fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-background transition-[width] duration-150"
        style={{ width: sidebarWidth }}
      >
        {/* Logo + collapse */}
        <div className="flex items-center justify-between border-b border-border px-3 py-3">
          {!collapsed && (
            <button onClick={() => router.push('/')} className="block">
              <span className="font-mono text-[10px] font-medium uppercase tracking-[0.2em]">
                GrokForge
              </span>
            </button>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="font-mono text-xs text-muted-foreground hover:text-foreground"
          >
            {collapsed ? '\u25B8' : '\u25C2'}
          </button>
        </div>

        {!collapsed && (
          <>
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
                  <div
                    key={repo.id}
                    className={`group mb-0.5 flex items-center justify-between px-2 py-1.5 transition-colors ${
                      activeRepoId === repo.id
                        ? 'bg-accent text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <button
                      onClick={() => {
                        setActiveRepoId(repo.id);
                        router.push(`/repos/${repo.id}`);
                      }}
                      className="min-w-0 flex-1 truncate text-left font-mono text-[11px]"
                    >
                      {repo.name}
                    </button>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm(`Delete ${repo.name}?`)) {
                          await api.repos.delete(repo.id);
                          setRepos((prev) => prev.filter((r) => r.id !== repo.id));
                          if (activeRepoId === repo.id) {
                            setActiveRepoId(null);
                            router.push('/');
                          }
                        }
                      }}
                      className="ml-1 shrink-0 font-mono text-[10px] text-transparent group-hover:text-foreground/20 hover:!text-red-400/70"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>

              {/* Branches */}
              {activeRepoId && branches.length > 0 && (
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
                  {checkoutError && (
                    <p className="mb-1 px-2 font-mono text-[9px] text-red-400">{checkoutError}</p>
                  )}
                  {branches.map((b) => (
                    <button
                      key={b.name}
                      onClick={() => handleCheckout(b.name)}
                      className={`mb-0.5 flex w-full items-center gap-1.5 truncate px-2 py-1 text-left font-mono text-[11px] transition-colors ${
                        b.is_current
                          ? 'text-foreground'
                          : 'text-foreground/25 hover:text-foreground/50'
                      }`}
                    >
                      {b.is_current && <span className="h-1 w-1 shrink-0 bg-foreground" />}
                      <span className="truncate">{b.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Sessions */}
              {activeRepoId && (
                <div className="border-t border-border px-2 pt-3 pb-4">
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
                      <span className="min-w-0 truncate font-mono text-[11px]">{s.title}</span>
                      <span
                        className={`ml-1 shrink-0 font-mono text-[8px] uppercase tracking-wider ${
                          s.status === 'completed' ? 'text-green-400/60' : 'text-foreground/20'
                        }`}
                      >
                        {STATUS_SHORT[s.status] || s.status}
                      </span>
                    </button>
                  ))}
                  {sessions.length === 0 && (
                    <p className="px-2 py-2 font-mono text-[10px] text-foreground/15">
                      No sessions
                    </p>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Bottom */}
            <div className="border-t border-border p-2">
              <button
                onClick={() => router.push('/settings')}
                className="block w-full px-2 py-1.5 text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
              >
                Settings
              </button>
            </div>
          </>
        )}

        {/* Resize handle */}
        {!collapsed && (
          <div
            onMouseDown={handleMouseDown}
            className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-foreground/10"
          />
        )}
      </aside>

      {/* Spacer for main content */}
      <style>{`main { padding-left: ${sidebarWidth}px; transition: padding-left 150ms; }`}</style>

      {/* Add repo dialog */}
      <Dialog open={addRepoOpen} onOpenChange={setAddRepoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-mono text-sm uppercase tracking-wider">
              Connect Repository
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {/* Tab switcher */}
            <div className="flex gap-px border border-border bg-border">
              <button
                onClick={() => setAddMode('path')}
                className={`flex-1 bg-background py-2 font-mono text-[10px] uppercase tracking-wider ${
                  addMode === 'path' ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                Local Path
              </button>
              <button
                onClick={() => setAddMode('url')}
                className={`flex-1 bg-background py-2 font-mono text-[10px] uppercase tracking-wider ${
                  addMode === 'url' ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                Clone URL
              </button>
            </div>
            {addMode === 'path' ? (
              <Input
                placeholder="/path/to/repository"
                value={repoPath}
                onChange={(e) => setRepoPath(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddRepo()}
                className="font-mono text-sm"
              />
            ) : (
              <Input
                placeholder="owner/repo or https://github.com/..."
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddRepo()}
                className="font-mono text-sm"
              />
            )}
            <Button onClick={handleAddRepo} disabled={adding} className="w-full">
              <span className="font-mono text-xs uppercase tracking-wider">
                {adding
                  ? addMode === 'url'
                    ? 'Cloning...'
                    : 'Scanning...'
                  : addMode === 'url'
                    ? 'Clone & Connect'
                    : 'Scan & Connect'}
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
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              From: {currentBranch}
            </p>
            <Input
              placeholder="feature/my-branch"
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateBranch()}
              className="font-mono text-sm"
            />
            <Button onClick={handleCreateBranch} className="w-full">
              <span className="font-mono text-xs uppercase tracking-wider">Create & Checkout</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
