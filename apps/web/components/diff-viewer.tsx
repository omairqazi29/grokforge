'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { PatchFileChange } from '@/lib/api-client';

interface DiffViewerProps {
  changes: PatchFileChange[];
  overallRationale: string;
}

function DiffBlock({ diff }: { diff: string }) {
  const lines = diff.split('\n');
  return (
    <pre className="overflow-x-auto rounded-md bg-muted p-4 font-mono text-sm">
      {lines.map((line, i) => {
        let color = '';
        if (line.startsWith('+') && !line.startsWith('+++'))
          color = 'text-green-600 dark:text-green-400';
        else if (line.startsWith('-') && !line.startsWith('---'))
          color = 'text-red-600 dark:text-red-400';
        else if (line.startsWith('@@')) color = 'text-blue-600 dark:text-blue-400';

        return (
          <div key={i} className={color}>
            {line}
          </div>
        );
      })}
    </pre>
  );
}

export function DiffViewer({ changes, overallRationale }: DiffViewerProps) {
  const [activeFile, setActiveFile] = useState(changes[0]?.file_path || '');

  if (changes.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No changes to display
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Overall Rationale</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{overallRationale}</p>
        </CardContent>
      </Card>

      <Tabs value={activeFile} onValueChange={setActiveFile}>
        <TabsList className="w-full justify-start overflow-x-auto">
          {changes.map((change) => {
            const filename = change.file_path.split('/').pop() || change.file_path;
            return (
              <TabsTrigger
                key={change.file_path}
                value={change.file_path}
                className="font-mono text-xs"
              >
                {filename}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {changes.map((change) => (
          <TabsContent key={change.file_path} value={change.file_path} className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono">
                {change.file_path}
              </Badge>
            </div>

            <ScrollArea className="max-h-[500px]">
              <DiffBlock diff={change.diff} />
            </ScrollArea>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Rationale</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{change.rationale}</p>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
