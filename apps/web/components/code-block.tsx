/**
 * Shared code/terminal output renderer.
 * Used by DiffViewer, ValidationPanel, and anywhere code is displayed.
 *
 * Design decision: Separation of rendering from interaction.
 * This component only renders lines with colors and numbers.
 * Selection/popup behavior is handled by the parent via onSelect callback.
 */

'use client';

import { useRef, useCallback } from 'react';

export interface CodeLine {
  text: string;
  lineNum?: string;
  lineNumRight?: string;
  color?: 'added' | 'removed' | 'info' | 'error' | 'warning' | 'default';
}

interface CodeBlockProps {
  lines: CodeLine[];
  onSelect?: (selectedText: string, position: { x: number; y: number }) => void;
  className?: string;
}

const COLOR_MAP: Record<string, string> = {
  added: 'bg-green-500/10 text-green-400',
  removed: 'bg-red-500/10 text-red-400',
  info: 'bg-blue-500/5 text-blue-400',
  error: 'bg-red-500/10 text-red-400',
  warning: 'bg-yellow-500/5 text-yellow-400/80',
  default: 'text-foreground/60',
};

export function CodeBlock({ lines, onSelect, className = '' }: CodeBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null);

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

  const hasLeftNum = lines.some((l) => l.lineNum);
  const hasRightNum = lines.some((l) => l.lineNumRight);

  return (
    <div
      ref={containerRef}
      onMouseUp={handleMouseUp}
      className={`overflow-x-auto font-mono text-xs leading-6 select-text ${className}`}
    >
      {lines.map((line, i) => {
        const colorClass = COLOR_MAP[line.color || 'default'];
        return (
          <div key={i} className={`flex hover:bg-foreground/5 ${colorClass}`}>
            {hasLeftNum && (
              <span className="w-8 shrink-0 select-none border-r border-border px-1 text-right text-foreground/15">
                {line.lineNum || ''}
              </span>
            )}
            {hasRightNum && (
              <span className="w-8 shrink-0 select-none border-r border-border px-1 text-right text-foreground/15">
                {line.lineNumRight || ''}
              </span>
            )}
            <span className="flex-1 px-3">{line.text || ' '}</span>
          </div>
        );
      })}
    </div>
  );
}
