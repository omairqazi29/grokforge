'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ValidationRun } from '@/lib/api-client';

interface ValidationPanelProps {
  runs: ValidationRun[];
  onRunValidation: (command: string) => void;
  loading?: boolean;
}

export function ValidationPanel({ runs, onRunValidation, loading }: ValidationPanelProps) {
  const [command, setCommand] = useState('');

  const handleRun = () => {
    if (!command.trim()) return;
    onRunValidation(command.trim());
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="e.g., npm test, pytest, pnpm lint"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleRun()}
          className="font-mono"
        />
        <Button onClick={handleRun} disabled={loading || !command.trim()}>
          {loading ? 'Running...' : 'Run'}
        </Button>
      </div>

      {runs.map((run) => (
        <Card key={run.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="font-mono text-sm">{run.command}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={run.exit_code === 0 ? 'default' : 'destructive'}>
                  {run.exit_code === 0 ? 'PASS' : `EXIT ${run.exit_code}`}
                </Badge>
                <span className="text-xs text-muted-foreground">{run.duration_ms}ms</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {run.stdout && (
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">stdout</p>
                <ScrollArea className="max-h-[200px]">
                  <pre className="rounded-md bg-muted p-3 font-mono text-xs">{run.stdout}</pre>
                </ScrollArea>
              </div>
            )}
            {run.stderr && (
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">stderr</p>
                <ScrollArea className="max-h-[200px]">
                  <pre className="rounded-md bg-red-50 p-3 font-mono text-xs text-red-800 dark:bg-red-950 dark:text-red-200">
                    {run.stderr}
                  </pre>
                </ScrollArea>
              </div>
            )}
            {run.analysis && (
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">Analysis</p>
                <p className="text-sm">{run.analysis}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
