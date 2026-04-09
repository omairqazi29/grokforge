'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface LiveRun {
  command: string;
  stdout: string[];
  stderr: string[];
  exitCode: number | null;
  durationMs: number | null;
  analysis: string | null;
  analyzing: boolean;
}

interface TerminalEmulatorProps {
  sessionId?: number;
  patchId?: number;
  onFallbackRun: (command: string) => void;
  liveRun: LiveRun | null;
  setLiveRun: React.Dispatch<React.SetStateAction<LiveRun | null>>;
}

export function TerminalEmulator({
  sessionId,
  patchId,
  onFallbackRun,
  liveRun,
  setLiveRun,
}: TerminalEmulatorProps) {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const liveOutputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    liveOutputRef.current?.scrollTo({ top: liveOutputRef.current.scrollHeight });
  }, [liveRun?.stdout, liveRun?.stderr]);

  const handleRun = useCallback(async () => {
    const cmd = command.trim();
    if (!cmd) return;
    if (!sessionId || !patchId) {
      onFallbackRun(cmd);
      return;
    }
    setHistory((prev) => [cmd, ...prev.filter((h) => h !== cmd)].slice(0, 20));
    setHistoryIdx(-1);
    setCommand('');

    setLiveRun({
      command: cmd,
      stdout: [],
      stderr: [],
      exitCode: null,
      durationMs: null,
      analysis: null,
      analyzing: false,
    });

    try {
      const res = await fetch(`${BASE_URL}/api/sessions/${sessionId}/validate-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd, patch_artifact_id: patchId }),
      });
      const reader = res.body?.getReader(),
        decoder = new TextDecoder();
      let buffer = '';
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const d = JSON.parse(line.slice(6)),
              u = setLiveRun;
            if (d.type === 'stdout') u((p) => (p ? { ...p, stdout: [...p.stdout, d.text] } : p));
            else if (d.type === 'stderr')
              u((p) => (p ? { ...p, stderr: [...p.stderr, d.text] } : p));
            else if (d.type === 'exit')
              u((p) => (p ? { ...p, exitCode: d.exit_code, durationMs: d.duration_ms } : p));
            else if (d.type === 'analyzing') u((p) => (p ? { ...p, analyzing: true } : p));
            else if (d.type === 'analysis')
              u((p) => (p ? { ...p, analysis: d.text, analyzing: false } : p));
          } catch {}
        }
      }
    } catch (err) {
      setLiveRun((prev) =>
        prev ? { ...prev, exitCode: 1, stderr: [...prev.stderr, String(err) + '\n'] } : prev,
      );
    }
  }, [command, sessionId, patchId, onFallbackRun, setLiveRun]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleRun();
    else if (e.key === 'ArrowUp') {
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

  return (
    <>
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
            placeholder="pytest, npm test, pip install ..."
            value={command}
            onChange={(e) => {
              setCommand(e.target.value);
              setHistoryIdx(-1);
            }}
            onKeyDown={handleKeyDown}
            className="border-0 bg-transparent p-0 font-mono text-sm shadow-none outline-none ring-0 focus-visible:ring-0"
          />
          <Button size="sm" onClick={handleRun} disabled={!command.trim()} className="shrink-0">
            <span className="font-mono text-[10px] uppercase tracking-wider">Run</span>
          </Button>
        </div>
      </div>

      {liveRun && (
        <div className="border border-border">
          <div className="flex items-center justify-between border-b border-border px-4 py-2">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-green-400/70">$</span>
              <span className="font-mono text-sm">{liveRun.command}</span>
            </div>
            <div className="flex items-center gap-4">
              {liveRun.exitCode === null ? (
                <span className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                  <span className="h-2 w-2 animate-spin border border-current border-t-transparent" />
                  Running
                </span>
              ) : (
                <>
                  <span
                    className={`font-mono text-xs uppercase tracking-wider ${liveRun.exitCode === 0 ? 'text-green-400' : 'text-red-400'}`}
                  >
                    {liveRun.exitCode === 0 ? 'PASS' : `EXIT ${liveRun.exitCode}`}
                  </span>
                  {liveRun.durationMs !== null && (
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {liveRun.durationMs}ms
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
          <div
            ref={liveOutputRef}
            className="max-h-[300px] overflow-y-auto p-4 font-mono text-xs leading-5"
          >
            {liveRun.stdout.map((line, i) => (
              <span key={`o${i}`} className="text-foreground/70">
                {line}
              </span>
            ))}
            {liveRun.stderr.map((line, i) => (
              <span key={`e${i}`} className="text-red-400/80">
                {line}
              </span>
            ))}
          </div>
          {liveRun.analyzing && (
            <div className="border-t border-border px-4 py-3">
              <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                <span className="h-1.5 w-1.5 animate-pulse bg-foreground/50" />
                Analyzing with Grok...
              </span>
            </div>
          )}
          {liveRun.analysis && (
            <div className="border-t border-border p-4">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Grok Analysis
              </p>
              <p className="text-xs leading-relaxed text-foreground/70">{liveRun.analysis}</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
