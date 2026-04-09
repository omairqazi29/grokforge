'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { PatchFileChange } from '@/lib/api-client';

interface DiffViewerProps {
  changes: PatchFileChange[];
  overallRationale: string;
  onReviewComment?: (comment: string, filePath: string, lineNumber?: number) => void;
}

function DiffBlock({
  diff,
  filePath,
  onAddComment,
}: {
  diff: string;
  filePath: string;
  onAddComment?: (line: number) => void;
}) {
  const lines = diff.split('\n');

  // Parse @@ headers to compute real line numbers
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

  return (
    <div className="overflow-x-auto font-mono text-xs leading-6">
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
        const displayLine = ln.new || ln.old || '';

        return (
          <div
            key={i}
            className={`group flex hover:bg-foreground/5 ${bg}`}
            onClick={() => displayLine && onAddComment?.(parseInt(displayLine, 10))}
          >
            <span className="w-8 shrink-0 select-none border-r border-border px-1 text-right text-foreground/15">
              {ln.old}
            </span>
            <span className="w-8 shrink-0 select-none border-r border-border px-1 text-right text-foreground/15">
              {ln.new}
            </span>
            <span className={`flex-1 px-3 ${textColor}`}>{line || ' '}</span>
            {onAddComment && displayLine && (
              <span className="shrink-0 cursor-pointer px-2 text-foreground/0 group-hover:text-foreground/30">
                +
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function DiffViewer({ changes, overallRationale, onReviewComment }: DiffViewerProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [commentLine, setCommentLine] = useState<number | null>(null);
  const [commentText, setCommentText] = useState('');

  if (changes.length === 0) {
    return (
      <div className="border border-border p-12 text-center">
        <p className="text-sm text-muted-foreground">No changes to display</p>
      </div>
    );
  }

  const activeChange = changes[activeIdx];

  const handleSubmitComment = () => {
    if (!commentText.trim() || !onReviewComment) return;
    onReviewComment(commentText.trim(), activeChange.file_path, commentLine || undefined);
    setCommentText('');
    setCommentLine(null);
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
                setCommentLine(null);
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
        <div className="max-h-[600px] overflow-y-auto">
          <DiffBlock
            diff={activeChange.diff}
            filePath={activeChange.file_path}
            onAddComment={onReviewComment ? (line) => setCommentLine(line) : undefined}
          />
        </div>

        {/* Inline comment box */}
        {commentLine !== null && onReviewComment && (
          <div className="border-t border-border p-4">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Review Comment &middot; Line {commentLine} &middot; {activeChange.file_path}
            </p>
            <Textarea
              placeholder="Suggest a change or leave feedback..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={2}
              className="mb-3 font-mono text-xs"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSubmitComment} disabled={!commentText.trim()}>
                <span className="font-mono text-xs uppercase tracking-wider">Submit</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setCommentLine(null);
                  setCommentText('');
                }}
              >
                <span className="font-mono text-xs uppercase tracking-wider">Cancel</span>
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
