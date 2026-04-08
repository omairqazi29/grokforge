'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { ValidationRun } from '@/lib/api-client';

interface ValidationPanelProps {
  runs: ValidationRun[];
  onRunValidation: (command: string) => void;
  loading?: boolean;
  repoId?: number;
}

function TerminalOutput({
  content,
  variant = 'stdout',
  onCreateSession,
}: {
  content: string;
  variant?: 'stdout' | 'stderr';
  onCreateSession?: (selectedText: string) => void;
}) {
  const [popupPos, setPopupPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const containerRef = useRef<HTMLPreElement>(null);

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    if (text && text.length > 5 && containerRef.current) {
      const range = selection!.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      setSelectedText(text);
      setPopupPos({
        x: rect.left - containerRect.left + rect.width / 2,
        y: rect.top - containerRect.top - 8,
      });
    } else {
      setPopupPos(null);
      setSelectedText('');
    }
  }, []);

  useEffect(() => {
    const dismiss = () => {
      setTimeout(() => {
        const sel = window.getSelection()?.toString().trim();
        if (!sel) {
          setPopupPos(null);
          setSelectedText('');
        }
      }, 200);
    };
    document.addEventListener('mousedown', dismiss);
    return () => document.removeEventListener('mousedown', dismiss);
  }, []);

  const lines = content.split('\n');

  return (
    <div className="relative">
      <pre
        ref={containerRef}
        onMouseUp={handleMouseUp}
        className={`overflow-x-auto p-4 font-mono text-xs leading-6 select-text ${
          variant === 'stderr' ? 'text-red-400/90' : 'text-foreground/70'
        }`}
      >
        {lines.map((line, i) => {
          const isError = /error|Error|ERROR|failed|FAILED|exception|Exception|Traceback/i.test(
            line,
          );
          const isWarning = /warning|Warning|WARN/i.test(line);
          return (
            <div
              key={i}
              className={`${
                isError
                  ? 'bg-red-500/10 text-red-400'
                  : isWarning
                    ? 'bg-yellow-500/5 text-yellow-400/80'
                    : ''
              }`}
            >
              <span className="mr-3 inline-block w-6 select-none text-right text-foreground/15">
                {i + 1}
              </span>
              {line || ' '}
            </div>
          );
        })}
      </pre>

      {/* Selection popup */}
      {popupPos && onCreateSession && (
        <div
          className="absolute z-50 -translate-x-1/2 -translate-y-full"
          style={{ left: popupPos.x, top: popupPos.y }}
        >
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onCreateSession(selectedText);
            }}
            className="border border-border bg-background px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider shadow-lg transition-colors hover:bg-accent"
          >
            Fix This
          </button>
        </div>
      )}
    </div>
  );
}

export function ValidationPanel({ runs, onRunValidation, loading, repoId }: ValidationPanelProps) {
  const router = useRouter();
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [fixDialogOpen, setFixDialogOpen] = useState(false);
  const [fixText, setFixText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleRun = () => {
    const cmd = command.trim();
    if (!cmd) return;
    setHistory((prev) => [cmd, ...prev.filter((h) => h !== cmd)].slice(0, 20));
    setHistoryIdx(-1);
    onRunValidation(cmd);
    setCommand('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRun();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(historyIdx + 1, history.length - 1);
      setHistoryIdx(next);
      if (history[next]) setCommand(history[next]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = historyIdx - 1;
      if (next < 0) {
        setHistoryIdx(-1);
        setCommand('');
      } else {
        setHistoryIdx(next);
        setCommand(history[next]);
      }
    }
  };

  const handleCreateSessionFromError = (selectedText: string) => {
    setFixText(selectedText);
    setFixDialogOpen(true);
  };

  const handleConfirmFix = () => {
    if (!repoId || !fixText.trim()) return;
    const taskDesc = `Fix the following error:\n\n${fixText}`;
    // Navigate and create session via URL params
    router.push(`/repos/${repoId}?autoCreate=true&task=${encodeURIComponent(taskDesc)}`);
    setFixDialogOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Terminal prompt */}
      <div className="border border-border">
        <div className="flex items-center border-b border-border px-4 py-2">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 bg-red-500/60" />
            <div className="h-2.5 w-2.5 bg-yellow-500/60" />
            <div className="h-2.5 w-2.5 bg-green-500/60" />
          </div>
          <span className="ml-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Terminal
          </span>
        </div>
        <div className="flex items-center gap-2 p-3">
          <span className="font-mono text-xs text-green-400/70">$</span>
          <Input
            ref={inputRef}
            placeholder="pytest, npm test, pnpm lint..."
            value={command}
            onChange={(e) => {
              setCommand(e.target.value);
              setHistoryIdx(-1);
            }}
            onKeyDown={handleKeyDown}
            className="border-0 bg-transparent p-0 font-mono text-sm text-foreground shadow-none outline-none ring-0 focus-visible:ring-0"
          />
          <Button
            size="sm"
            onClick={handleRun}
            disabled={loading || !command.trim()}
            className="shrink-0"
          >
            <span className="font-mono text-[10px] uppercase tracking-wider">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 animate-spin border border-current border-t-transparent" />
                  Running
                </span>
              ) : (
                'Run'
              )}
            </span>
          </Button>
        </div>
      </div>

      {/* Results */}
      {runs.map((run) => (
        <div key={run.id} className="border border-border">
          {/* Header bar */}
          <div className="flex items-center justify-between border-b border-border px-4 py-2">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-green-400/70">$</span>
              <span className="font-mono text-sm">{run.command}</span>
            </div>
            <div className="flex items-center gap-4">
              <span
                className={`font-mono text-xs uppercase tracking-wider ${
                  run.exit_code === 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {run.exit_code === 0 ? 'PASS' : `EXIT ${run.exit_code}`}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {run.duration_ms}ms
              </span>
            </div>
          </div>

          {/* Output */}
          {run.stdout && (
            <div className="border-b border-border">
              <TerminalOutput
                content={run.stdout}
                variant="stdout"
                onCreateSession={repoId ? handleCreateSessionFromError : undefined}
              />
            </div>
          )}
          {run.stderr && (
            <div className="border-b border-border">
              <TerminalOutput
                content={run.stderr}
                variant="stderr"
                onCreateSession={repoId ? handleCreateSessionFromError : undefined}
              />
            </div>
          )}
          {run.analysis && (
            <div className="p-4">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Grok Analysis
              </p>
              <p className="text-xs leading-relaxed text-foreground/70">{run.analysis}</p>
            </div>
          )}
        </div>
      ))}

      {/* Fix dialog */}
      <Dialog open={fixDialogOpen} onOpenChange={setFixDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-mono text-sm uppercase tracking-wider">
              Create Fix Session
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Selected Error
              </p>
              <pre className="max-h-[200px] overflow-auto border border-border p-3 font-mono text-xs text-red-400/80">
                {fixText}
              </pre>
            </div>
            <p className="text-xs text-muted-foreground">
              This will create a new session with the task: &quot;Fix the following error&quot; and
              the selected text as context.
            </p>
            <div className="flex gap-3">
              <Button onClick={handleConfirmFix} className="flex-1">
                <span className="font-mono text-xs uppercase tracking-wider">Create Session</span>
              </Button>
              <Button variant="outline" onClick={() => setFixDialogOpen(false)}>
                <span className="font-mono text-xs uppercase tracking-wider">Cancel</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
