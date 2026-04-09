'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api-client';
import ReactMarkdown from 'react-markdown';

interface GrokChatProps {
  repoId?: number;
  sessionId?: number;
}

export function GrokChat({ repoId, sessionId }: GrokChatProps) {
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

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

  return (
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
  );
}
