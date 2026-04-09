'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { PatchFileChange } from '@/lib/api-client';

interface DiffViewerProps {
  changes: PatchFileChange[];
  overallRationale: string;
  onReviewComment?: (comment: string, filePath: string, selectedCode?: string) => void;
}

function DiffBlock({
  diff,
  filePath,
  onSelect,
}: {
  diff: string;
  filePath: string;
  onSelect?: (selectedText: string, rect: { x: number; y: number }) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lines = diff.split('\n');

  // Parse @@ headers for real line numbers
  let oldLine = 0;
  let newLine = 0;
  const lineNumbers: { old: string; new: string }[] = [];

  for (const line of lines) {
    const hunkMatch = line.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (hunkMatch) {
      oldLine = parseInt(hunkMatch[1], 10);
      newLine = parseInt(hunkMatch[2], 10);
      lineNumbers.push({ old: '...', new: '...' });
    } else if (line.startsWith('---') || line.startsWith('+++')) {
      lineNumbers.push({ old: '', new: '' });
    } else if (line.startsWith('-')) {
      lineNumbers.push({ old: String(oldLine), new: '' });
      oldLine++;
    } else if (line.startsWith('+')) {
      lineNumbers.push({ old: '', new: String(newLine) });
      newLine++;
    } else {
      lineNumbers.push({ old: String(oldLine), new: String(newLine) });
      oldLine++;
      newLine++;
    }
  }

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

  return (
    <div
      ref={containerRef}
      onMouseUp={handleMouseUp}
      className="overflow-x-auto font-mono text-xs leading-6 select-text"
    >
      {lines.map((line, i) => {
        let bg = '';
        let textColor = 'text-foreground/60';
        if (line.startsWith('+') && !line.startsWith('+++')) {
          bg = 'bg-green-500/10';
          textColor = 'text-green-400';
        } else if (line.startsWith('-') && !line.startsWith('---')) {
          bg = 'bg-red-500/10';
          textColor = 'text-red-400';
        } else if (line.startsWith('@@')) {
          bg = 'bg-blue-500/5';
          textColor = 'text-blue-400';
        }

        const ln = lineNumbers[i] || { old: '', new: '' };

        return (
          <div key={i} className={`flex hover:bg-foreground/5 ${bg}`}>
            <span className="w-8 shrink-0 select-none border-r border-border px-1 text-right text-foreground/15">
              {ln.old}
            </span>
            <span className="w-8 shrink-0 select-none border-r border-border px-1 text-right text-foreground/15">
              {ln.new}
            </span>
            <span className={`flex-1 px-3 ${textColor}`}>{line || ' '}</span>
          </div>
        );
      })}
    </div>
  );
}

export function DiffViewer({ changes, overallRationale, onReviewComment }: DiffViewerProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [popupPos, setPopupPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedCode, setSelectedCode] = useState('');
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState('');

  // Dismiss popup when clicking elsewhere
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

  if (changes.length === 0) {
    return (
      <div className="border border-border p-12 text-center">
        <p className="text-sm text-muted-foreground">No changes to display</p>
      </div>
    );
  }

  const activeChange = changes[activeIdx];

  const handleSelect = (text: string, rect: { x: number; y: number }) => {
    if (!onReviewComment) return;
    setSelectedCode(text);
    setPopupPos(rect);
    setCommentOpen(false);
  };

  const handleOpenComment = () => {
    setCommentOpen(true);
    setPopupPos(null);
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
      {/* Overall Rationale */}
      <div className="border border-border p-6">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Summary
        </p>
        <p className="text-sm leading-relaxed text-foreground/80">{overallRationale}</p>
      </div>

      {/* File tabs + diff */}
      <div className="border border-border">
        {/* File tabs */}
        <div className="flex overflow-x-auto border-b border-border">
          {changes.map((change, idx) => (
            <button
              key={change.file_path}
              onClick={() => {
                setActiveIdx(idx);
                setPopupPos(null);
                setCommentOpen(false);
              }}
              className={`shrink-0 border-r border-border px-4 py-3 font-mono text-xs transition-colors ${
                idx === activeIdx
                  ? 'bg-foreground/5 text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {change.file_path}
            </button>
          ))}
        </div>

        {/* Diff content */}
        <div className="relative max-h-[600px] overflow-y-auto">
          <DiffBlock
            diff={activeChange.diff}
            filePath={activeChange.file_path}
            onSelect={onReviewComment ? handleSelect : undefined}
          />

          {/* Selection popup */}
          {popupPos && !commentOpen && (
            <div
              className="absolute z-50 -translate-x-1/2 -translate-y-full"
              style={{ left: popupPos.x, top: popupPos.y }}
            >
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleOpenComment();
                }}
                className="border border-border bg-background px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider shadow-lg transition-colors hover:bg-accent"
              >
                Review
              </button>
            </div>
          )}
        </div>

        {/* Comment input */}
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

        {/* Per-file rationale */}
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
