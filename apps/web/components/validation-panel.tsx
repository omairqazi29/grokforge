'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { type ValidationRun } from '@/lib/api-client';
import { TerminalEmulator, type LiveRun } from '@/components/terminal-emulator';
import { GrokChat } from '@/components/grok-chat';

interface ValidationPanelProps {
  runs: ValidationRun[];
  onRunValidation: (command: string) => void;
  loading?: boolean;
  repoId?: number;
  sessionId?: number;
  patchId?: number;
}

function TerminalOutput({
  content,
  variant = 'stdout',
  onCreateSession,
}: {
  content: string;
  variant?: 'stdout' | 'stderr';
  onCreateSession?: (text: string) => void;
}) {
  const [popupPos, setPopupPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const containerRef = useRef<HTMLPreElement>(null);
  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection(),
      text = sel?.toString().trim();
    if (text && text.length > 5 && containerRef.current) {
      const rect = sel!.getRangeAt(0).getBoundingClientRect();
      const cr = containerRef.current.getBoundingClientRect();
      setSelectedText(text);
      setPopupPos({ x: rect.left - cr.left + rect.width / 2, y: rect.top - cr.top - 8 });
    } else setPopupPos(null);
  }, []);
  return (
    <div className="relative">
      <pre
        ref={containerRef}
        onMouseUp={handleMouseUp}
        className={`overflow-x-auto p-4 font-mono text-xs leading-6 select-text ${variant === 'stderr' ? 'text-red-400/90' : 'text-foreground/70'}`}
      >
        {content.split('\n').map((line, i) => (
          <div
            key={i}
            className={
              /error|failed|exception|Traceback/i.test(line) ? 'bg-red-500/10 text-red-400' : ''
            }
          >
            <span className="mr-3 inline-block w-6 select-none text-right text-foreground/15">
              {i + 1}
            </span>
            {line || ' '}
          </div>
        ))}
      </pre>
      {popupPos && onCreateSession && (
        <div
          className="absolute z-50 -translate-x-1/2 -translate-y-full"
          style={{ left: popupPos.x, top: popupPos.y }}
        >
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              onCreateSession(selectedText);
            }}
            className="border border-border bg-background px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider shadow-lg hover:bg-accent"
          >
            Fix This
          </button>
        </div>
      )}
    </div>
  );
}

export function ValidationPanel({
  runs,
  onRunValidation,
  loading,
  repoId,
  sessionId,
  patchId,
}: ValidationPanelProps) {
  const router = useRouter();
  const [liveRun, setLiveRun] = useState<LiveRun | null>(null);
  const [fixDialogOpen, setFixDialogOpen] = useState(false);
  const [fixText, setFixText] = useState('');
  const handleFixThis = (text: string) => {
    setFixText(text);
    setFixDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <TerminalEmulator
        sessionId={sessionId}
        patchId={patchId}
        onFallbackRun={onRunValidation}
        liveRun={liveRun}
        setLiveRun={setLiveRun}
      />

      {/* Previous runs */}
      {runs.map((run) => (
        <div key={run.id} className="border border-border">
          <div className="flex items-center justify-between border-b border-border px-4 py-2">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-green-400/70">$</span>
              <span className="font-mono text-sm">{run.command}</span>
            </div>
            <div className="flex items-center gap-4">
              <span
                className={`font-mono text-xs uppercase tracking-wider ${run.exit_code === 0 ? 'text-green-400' : 'text-red-400'}`}
              >
                {run.exit_code === 0 ? 'PASS' : `EXIT ${run.exit_code}`}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {run.duration_ms}ms
              </span>
            </div>
          </div>
          {run.stdout && (
            <div className="border-b border-border">
              <TerminalOutput
                content={run.stdout}
                variant="stdout"
                onCreateSession={repoId ? handleFixThis : undefined}
              />
            </div>
          )}
          {run.stderr && (
            <div className="border-b border-border">
              <TerminalOutput
                content={run.stderr}
                variant="stderr"
                onCreateSession={repoId ? handleFixThis : undefined}
              />
            </div>
          )}
          {run.analysis && (
            <div>
              <div className="px-4 pt-4 pb-1">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Grok Analysis
                </p>
              </div>
              <TerminalOutput
                content={run.analysis}
                variant="stdout"
                onCreateSession={repoId ? handleFixThis : undefined}
              />
            </div>
          )}
        </div>
      ))}

      <GrokChat repoId={repoId} sessionId={sessionId} />

      <Dialog open={fixDialogOpen} onOpenChange={setFixDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-mono text-sm uppercase tracking-wider">
              Create Fix Session
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <pre className="max-h-[200px] overflow-auto border border-border p-3 font-mono text-xs text-red-400/80">
              {fixText}
            </pre>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  if (repoId)
                    router.push(
                      `/repos/${repoId}?autoCreate=true&task=${encodeURIComponent(`Fix: ${fixText}`)}`,
                    );
                  setFixDialogOpen(false);
                }}
                className="flex-1"
              >
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
