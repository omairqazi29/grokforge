'use client';

import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FileTreeProps {
  files: string[];
  symbolIndex?: Record<string, string[]>;
}

interface TreeNode {
  name: string;
  path: string;
  children: Map<string, TreeNode>;
  isFile: boolean;
}

function buildTree(files: string[]): TreeNode {
  const root: TreeNode = { name: '', path: '', children: new Map(), isFile: false };
  for (const file of files) {
    const parts = file.split('/');
    let current = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!current.children.has(part)) {
        current.children.set(part, {
          name: part,
          path: parts.slice(0, i + 1).join('/'),
          children: new Map(),
          isFile: i === parts.length - 1,
        });
      }
      current = current.children.get(part)!;
    }
  }
  return root;
}

function TreeItem({
  node,
  depth,
  symbolIndex,
}: {
  node: TreeNode;
  depth: number;
  symbolIndex?: Record<string, string[]>;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const symbols = node.isFile ? symbolIndex?.[node.path] : undefined;

  if (node.isFile) {
    return (
      <div className="group" style={{ paddingLeft: `${depth * 16}px` }}>
        <div className="flex items-center gap-1.5 rounded px-2 py-0.5 text-sm hover:bg-muted">
          <span className="text-muted-foreground">{'  '}</span>
          <span>{node.name}</span>
        </div>
        {symbols && symbols.length > 0 && (
          <div
            className="ml-6 text-xs text-muted-foreground"
            style={{ paddingLeft: `${depth * 16}px` }}
          >
            {symbols.slice(0, 5).join(', ')}
            {symbols.length > 5 && ` +${symbols.length - 5} more`}
          </div>
        )}
      </div>
    );
  }

  const sortedChildren = Array.from(node.children.values()).sort((a, b) => {
    if (a.isFile === b.isFile) return a.name.localeCompare(b.name);
    return a.isFile ? 1 : -1;
  });

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-1.5 rounded px-2 py-0.5 text-sm hover:bg-muted"
        style={{ paddingLeft: `${depth * 16}px` }}
      >
        <span className="text-muted-foreground">{expanded ? '\u25BE' : '\u25B8'}</span>
        <span className="font-medium">{node.name}/</span>
      </button>
      {expanded &&
        sortedChildren.map((child) => (
          <TreeItem key={child.path} node={child} depth={depth + 1} symbolIndex={symbolIndex} />
        ))}
    </div>
  );
}

export function FileTree({ files, symbolIndex }: FileTreeProps) {
  const tree = buildTree(files);
  const sortedChildren = Array.from(tree.children.values()).sort((a, b) => {
    if (a.isFile === b.isFile) return a.name.localeCompare(b.name);
    return a.isFile ? 1 : -1;
  });

  return (
    <ScrollArea className="h-full">
      <div className="py-2">
        {sortedChildren.map((child) => (
          <TreeItem key={child.path} node={child} depth={0} symbolIndex={symbolIndex} />
        ))}
      </div>
    </ScrollArea>
  );
}
