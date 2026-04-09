'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { api, type ValidationRun } from '@/lib/api-client';
import ReactMarkdown from 'react-markdown';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ValidationPanelProps {
  runs: ValidationRun[];
  onRunValidation: (command: string) => void;
  loading?: boolean;
  repoId?: number;
  sessionId?: number;
  patchId?: number;
}

// Streaming terminal run
interface LiveRun {
  command: string;
  stdout: string[];
  stderr: string[];
  exitCode: number | null;
  durationMs: number | null;
  analysis: string | null;
  analyzing: boolean;
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
    }
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
          const isError = /error|Error|ERROR|failed|FAILED|exception|Traceback/i.test(line);
          return (
            <div key={i} className={isError ? 'bg-red-500/10 text-red-400' : ''}>
              <span className="mr-3 inline-block w-6 select-none text-right text-foreground/15">
                {i + 1}
              </span>
              {line || ' '}
            </div>
          );
        })}
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
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [fixDialogOpen, setFixDialogOpen] = useState(false);
  const [fixText, setFixText] = useState('');

  // Streaming state
  const [liveRun, setLiveRun] = useState<LiveRun | null>(null);
  const liveOutputRef = useRef<HTMLDivElement>(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll live output
  useEffect(() => {
    liveOutputRef.current?.scrollTo({ top: liveOutputRef.current.scrollHeight });
  }, [liveRun?.stdout, liveRun?.stderr]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleRun = async () => {
    const cmd = command.trim();
    if (!cmd || !sessionId || !patchId) {
      // Fallback to non-streaming
      if (cmd) onRunValidation(cmd);
      return;
    }
    setHistory((prev) => [cmd, ...prev.filter((h) => h !== cmd)].slice(0, 20));
    setHistoryIdx(-1);
    setCommand('');

    // Start streaming
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

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
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
            const data = JSON.parse(line.slice(6));
            if (data.type === 'stdout') {
              setLiveRun((prev) =>
                prev ? { ...prev, stdout: [...prev.stdout, data.text] } : prev,
              );
            } else if (data.type === 'stderr') {
              setLiveRun((prev) =>
                prev ? { ...prev, stderr: [...prev.stderr, data.text] } : prev,
              );
            } else if (data.type === 'exit') {
              setLiveRun((prev) =>
                prev ? { ...prev, exitCode: data.exit_code, durationMs: data.duration_ms } : prev,
              );
            } else if (data.type === 'analyzing') {
              setLiveRun((prev) => (prev ? { ...prev, analyzing: true } : prev));
            } else if (data.type === 'analysis') {
              setLiveRun((prev) =>
                prev ? { ...prev, analysis: data.text, analyzing: false } : prev,
              );
            } else if (data.type === 'done') {
              // Reload runs to include the saved one
              // The parent will pick it up via periodic refresh
            }
          } catch {}
        }
      }
    } catch (err) {
      setLiveRun((prev) =>
        prev ? { ...prev, exitCode: 1, stderr: [...prev.stderr, String(err) + '\n'] } : prev,
      );
    }
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

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = { role: 'user', content: chatInput.trim() };
    const updated = [...chatMessages, userMsg];
    setChatMessages(updated);
    setChatInput('');
    setChatLoading(true);
    try {
      const res = await api.chat.send(updated, repoId, sessionId);
      setChatMessages([...updated, { role: 'assistant', content: res.reply }]);
    } catch (err) {
      setChatMessages([...updated, { role: 'assistant', content: 'Error: ' + String(err) }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleFixThis = (text: string) => {
    setFixText(text);
    setFixDialogOpen(true);
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

      {/* Live streaming output */}
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
                    className={`font-mono text-xs uppercase tracking-wider ${
                      liveRun.exitCode === 0 ? 'text-green-400' : 'text-red-400'
                    }`}
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
            <div className="p-4">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Grok Analysis
              </p>
              <p className="text-xs leading-relaxed text-foreground/70">{run.analysis}</p>
            </div>
          )}
        </div>
      ))}

      {/* Grok Chat */}
      <div className="border border-border">
        <div className="flex items-center border-b border-border px-4 py-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Ask Grok
          </span>
        </div>
        <div className="max-h-[250px] overflow-y-auto p-4">
          {chatMessages.length === 0 && (
            <p className="py-4 text-center font-mono text-[10px] text-foreground/20">
              Ask how to run the app, debug errors, or anything about the codebase
            </p>
          )}
          {chatMessages.map((msg, i) => (
            <div key={i} className={`mb-3 ${msg.role === 'user' ? 'text-right' : ''}`}>
              {msg.role === 'user' ? (
                <span className="inline-block max-w-[85%] bg-foreground/5 px-3 py-2 text-xs leading-relaxed text-foreground">
                  {msg.content}
                </span>
              ) : (
                <div className="inline-block max-w-[85%] border border-border px-4 py-3 text-left text-xs leading-relaxed text-foreground/70">
                  <ReactMarkdown
                    components={{
                      h3: ({ children }) => (
                        <p className="mb-2 mt-3 font-mono text-[10px] font-medium uppercase tracking-wider text-foreground/50 first:mt-0">
                          {children}
                        </p>
                      ),
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      code: ({ children, className }) => {
                        const isBlock = className?.includes('language-');
                        return isBlock ? (
                          <pre className="my-2 overflow-x-auto border border-border bg-foreground/[0.03] p-3 font-mono text-[11px] leading-5">
                            <code>{children}</code>
                          </pre>
                        ) : (
                          <code className="border border-border bg-foreground/5 px-1 py-0.5 font-mono text-[11px]">
                            {children}
                          </code>
                        );
                      },
                      pre: ({ children }) => <>{children}</>,
                      ul: ({ children }) => (
                        <ul className="mb-2 ml-4 list-disc space-y-1">{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="mb-2 ml-4 list-decimal space-y-1">{children}</ol>
                      ),
                      li: ({ children }) => <li>{children}</li>,
                      strong: ({ children }) => (
                        <strong className="text-foreground">{children}</strong>
                      ),
                      a: ({ children, href }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline underline-offset-2 hover:text-foreground"
                        >
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          ))}
          {chatLoading && (
            <div className="mb-3">
              <span className="inline-flex items-center gap-2 border border-border px-3 py-2 font-mono text-[10px] text-muted-foreground">
                <span className="h-1.5 w-1.5 animate-pulse bg-foreground/50" />
                Thinking...
              </span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        <div className="flex gap-2 border-t border-border p-3">
          <Input
            placeholder="How do I run the tests?"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleChat()}
            className="border-0 bg-transparent p-0 font-mono text-sm shadow-none ring-0 focus-visible:ring-0"
          />
          <Button
            size="sm"
            onClick={handleChat}
            disabled={chatLoading || !chatInput.trim()}
            className="shrink-0"
          >
            <span className="font-mono text-[10px] uppercase tracking-wider">Ask</span>
          </Button>
        </div>
      </div>

      {/* Fix dialog */}
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
