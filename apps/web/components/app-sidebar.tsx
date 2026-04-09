'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SIDEBAR_CONFIG, STATUS_DISPLAY } from '@/lib/constants';
import { useSidebarData } from '@/hooks/use-sidebar-data';
import { AddRepoDialog } from '@/components/sidebar/add-repo-dialog';
import { CreateBranchDialog } from '@/components/sidebar/create-branch-dialog';

export function AppSidebar() {
  const router = useRouter();
  const data = useSidebarData();
  const { repos, sessions, branches, currentBranch, activeRepoId, activeSessionId, checkoutError } =
    data;

  const [collapsed, setCollapsed] = useState(false);
  const [width, setWidth] = useState<number>(SIDEBAR_CONFIG.DEFAULT_WIDTH);
  const [resizing, setResizing] = useState(false);
  const [addRepoOpen, setAddRepoOpen] = useState(false);
  const [newBranchOpen, setNewBranchOpen] = useState(false);

  useEffect(() => {
    if (!resizing) return;
    const onMove = (e: MouseEvent) =>
      setWidth(Math.max(SIDEBAR_CONFIG.MIN_WIDTH, Math.min(SIDEBAR_CONFIG.MAX_WIDTH, e.clientX)));
    const onUp = () => setResizing(false);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [resizing]);

  const sw = collapsed ? SIDEBAR_CONFIG.COLLAPSED_WIDTH : width;

  return (
    <>
      <aside
        className="fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-background transition-[width] duration-150"
        style={{ width: sw }}
      >
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
                <SectionHeader label="Repos" onAdd={() => setAddRepoOpen(true)} />
                {repos.map((repo) => (
                  <div
                    key={repo.id}
                    className={`group mb-0.5 flex items-center justify-between px-2 py-1.5 transition-colors ${activeRepoId === repo.id ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <button
                      onClick={() => {
                        data.setActiveRepoId(repo.id);
                        router.push(`/repos/${repo.id}`);
                      }}
                      className="min-w-0 flex-1 truncate text-left font-mono text-[11px]"
                    >
                      {repo.name}
                    </button>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm(`Delete ${repo.name}?`)) await data.deleteRepo(repo.id);
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
                  <SectionHeader label="Branch" onAdd={() => setNewBranchOpen(true)} />
                  {checkoutError && (
                    <p className="mb-1 px-2 font-mono text-[9px] text-red-400">{checkoutError}</p>
                  )}
                  {branches.map((b) => (
                    <button
                      key={b.name}
                      onClick={() => data.checkoutBranch(b.name)}
                      className={`mb-0.5 flex w-full items-center gap-1.5 truncate px-2 py-1 text-left font-mono text-[11px] transition-colors ${b.is_current ? 'text-foreground' : 'text-foreground/25 hover:text-foreground/50'}`}
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
                  <SectionHeader
                    label="Sessions"
                    onAdd={() => router.push(`/repos/${activeRepoId}`)}
                  />
                  {sessions.map((s) => {
                    const d = STATUS_DISPLAY[s.status];
                    return (
                      <button
                        key={s.id}
                        onClick={() => router.push(`/sessions/${s.id}`)}
                        className={`mb-0.5 flex w-full items-center justify-between px-2 py-1.5 text-left transition-colors ${activeSessionId === s.id ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        <span className="min-w-0 truncate font-mono text-[11px]">{s.title}</span>
                        <span
                          className={`ml-1 shrink-0 font-mono text-[8px] uppercase tracking-wider ${d?.color || 'text-foreground/20'}`}
                        >
                          {d?.short || s.status}
                        </span>
                      </button>
                    );
                  })}
                  {sessions.length === 0 && (
                    <p className="px-2 py-2 font-mono text-[10px] text-foreground/15">
                      No sessions
                    </p>
                  )}
                </div>
              )}
            </ScrollArea>

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

        {!collapsed && (
          <div
            onMouseDown={() => setResizing(true)}
            className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-foreground/10"
          />
        )}
      </aside>

      <style>{`main { padding-left: ${sw}px; transition: padding-left 150ms; }`}</style>
      <AddRepoDialog open={addRepoOpen} onOpenChange={setAddRepoOpen} onAdd={data.addRepo} />
      <CreateBranchDialog
        open={newBranchOpen}
        onOpenChange={setNewBranchOpen}
        currentBranch={currentBranch}
        onCreate={data.createBranch}
      />
    </>
  );
}

function SectionHeader({ label, onAdd }: { label: string; onAdd: () => void }) {
  return (
    <div className="flex items-center justify-between px-2 pb-2">
      <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <button
        onClick={onAdd}
        className="font-mono text-[10px] text-muted-foreground hover:text-foreground"
      >
        +
      </button>
    </div>
  );
}
