'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { Session } from '@/lib/api-client';

interface SessionSidebarProps {
  sessions: Session[];
  activeSessionId?: number;
  repoName: string;
  onNewSession: () => void;
}

const STATUS_COLORS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  created: 'outline',
  planning: 'secondary',
  planned: 'secondary',
  patching: 'secondary',
  validating: 'secondary',
  reviewing: 'default',
  completed: 'default',
};

export function SessionSidebar({
  sessions,
  activeSessionId,
  repoName,
  onNewSession,
}: SessionSidebarProps) {
  const router = useRouter();

  return (
    <div className="flex h-full flex-col">
      <div className="p-4">
        <button
          onClick={() => router.push('/')}
          className="mb-2 text-xs text-muted-foreground hover:text-foreground"
        >
          &larr; All Repositories
        </button>
        <h2 className="truncate text-lg font-semibold">{repoName}</h2>
      </div>
      <Separator />
      <div className="p-4">
        <Button onClick={onNewSession} className="w-full" size="sm">
          New Session
        </Button>
      </div>
      <Separator />
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => router.push(`/sessions/${session.id}`)}
              className={`w-full rounded-md px-3 py-2 text-left transition-colors hover:bg-muted ${
                session.id === activeSessionId ? 'bg-muted' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="truncate text-sm font-medium">{session.title}</span>
                <Badge
                  variant={STATUS_COLORS[session.status] || 'outline'}
                  className="ml-2 text-xs"
                >
                  {session.status}
                </Badge>
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {session.task_description}
              </p>
            </button>
          ))}
          {sessions.length === 0 && (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">No sessions yet</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
