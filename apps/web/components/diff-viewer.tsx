'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { parseDiffLines } from '@/lib/diff-utils';
import type { PatchFileChange } from '@/lib/api-client';

interface DiffViewerProps {
  changes: PatchFileChange[];
  overallRationale: string;
  onReviewComment?: (comment: string, filePath: string, selectedCode?: string) => void;
}

function DiffBlock({
  diff,
  onSelect,
}: {
  diff: string;
  filePath: string;
  onSelect?: (selectedText: string, rect: { x: number; y: number }) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lines = parseDiffLines(diff);

  const handleMouseUp = useCallback(() => {
    if (!onSelect || !containerRef.current) return;
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    if (text && text.length > 2) {
      const range = selection!.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      onSelect(text, {
        x: rect.left - containerRect.left + rect.width / 2,
        y: rect.top - containerRect.top - 8,
      });
    }
  }, [onSelect]);

  const bgMap = {
    add: 'bg-green-500/10',
    remove: 'bg-red-500/10',
    hunk: 'bg-blue-500/5',
    meta: '',
    context: '',
  };
  const colorMap = {
    add: 'text-green-400',
    remove: 'text-red-400',
    hunk: 'text-blue-400',
    meta: 'text-foreground/60',
    context: 'text-foreground/60',
  };

  return (
    <div
      ref={containerRef}
      onMouseUp={handleMouseUp}
      className="overflow-x-auto font-mono text-xs leading-6 select-text"
    >
      {lines.map((ln, i) => (
        <div key={i} className={`flex hover:bg-foreground/5 ${bgMap[ln.type]}`}>
          <span className="w-8 shrink-0 select-none border-r border-border px-1 text-right text-foreground/15">
            {ln.oldNum}
          </span>
          <span className="w-8 shrink-0 select-none border-r border-border px-1 text-right text-foreground/15">
            {ln.newNum}
          </span>
          <span className={`flex-1 px-3 ${colorMap[ln.type]}`}>{ln.text || ' '}</span>
        </div>
      ))}
    </div>
  );
}

export function DiffViewer({ changes, overallRationale, onReviewComment }: DiffViewerProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [popupPos, setPopupPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedCode, setSelectedCode] = useState('');
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    const dismiss = () => {
      setTimeout(() => {
        const sel = window.getSelection()?.toString().trim();
        if (!sel && !commentOpen) {
          setPopupPos(null);
          setSelectedCode('');
        }
      }, 200);
    };
    document.addEventListener('mousedown', dismiss);
    return () => document.removeEventListener('mousedown', dismiss);
  }, [commentOpen]);

  if (changes.length === 0)
    return (
      <div className="border border-border p-12 text-center">
        <p className="text-sm text-muted-foreground">No changes to display</p>
      </div>
    );

  const activeChange = changes[activeIdx];
  const handleSelect = (text: string, rect: { x: number; y: number }) => {
    if (!onReviewComment) return;
    setSelectedCode(text);
    setPopupPos(rect);
    setCommentOpen(false);
  };
  const handleSubmitComment = () => {
    if (!commentText.trim() || !onReviewComment) return;
    onReviewComment(commentText.trim(), activeChange.file_path, selectedCode);
    setCommentText('');
    setCommentOpen(false);
    setSelectedCode('');
  };

  return (
    <div className="space-y-6">
      <div className="border border-border p-6">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Summary
        </p>
        <p className="text-sm leading-relaxed text-foreground/80">{overallRationale}</p>
      </div>

      <div className="border border-border">
        <div className="flex overflow-x-auto border-b border-border">
          {changes.map((change, idx) => (
            <button
              key={change.file_path}
              onClick={() => {
                setActiveIdx(idx);
                setPopupPos(null);
                setCommentOpen(false);
              }}
              className={`shrink-0 border-r border-border px-4 py-3 font-mono text-xs transition-colors ${idx === activeIdx ? 'bg-foreground/5 text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {change.file_path}
            </button>
          ))}
        </div>

        <div className="relative max-h-[600px] overflow-y-auto">
          <DiffBlock
            diff={activeChange.diff}
            filePath={activeChange.file_path}
            onSelect={onReviewComment ? handleSelect : undefined}
          />
          {popupPos && !commentOpen && (
            <div
              className="absolute z-50 -translate-x-1/2 -translate-y-full"
              style={{ left: popupPos.x, top: popupPos.y }}
            >
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCommentOpen(true);
                  setPopupPos(null);
                }}
                className="border border-border bg-background px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider shadow-lg transition-colors hover:bg-accent"
              >
                Review
              </button>
            </div>
          )}
        </div>

        {commentOpen && onReviewComment && (
          <div className="border-t border-border p-4">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Review &middot; {activeChange.file_path}
            </p>
            {selectedCode && (
              <pre className="mb-3 max-h-[80px] overflow-auto border border-border bg-foreground/[0.02] p-2 font-mono text-[10px] text-foreground/50">
                {selectedCode}
              </pre>
            )}
            <Textarea
              placeholder="Suggest a change or leave feedback on the selected code..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={2}
              className="mb-3 font-mono text-xs"
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSubmitComment} disabled={!commentText.trim()}>
                <span className="font-mono text-[10px] uppercase tracking-wider">Submit</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setCommentOpen(false);
                  setSelectedCode('');
                  setCommentText('');
                }}
              >
                <span className="font-mono text-[10px] uppercase tracking-wider">Cancel</span>
              </Button>
            </div>
          </div>
        )}

        <div className="border-t border-border p-6">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Rationale &middot; {activeChange.file_path}
          </p>
          <p className="text-xs leading-relaxed text-foreground/70">{activeChange.rationale}</p>
        </div>
      </div>
    </div>
  );
}
