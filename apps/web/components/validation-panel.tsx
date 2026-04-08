'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    <div className="space-y-6">
      {/* Command input */}
      <div className="flex gap-3">
        <Input
          placeholder="pytest, npm test, pnpm lint..."
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleRun()}
          className="font-mono text-sm"
        />
        <Button onClick={handleRun} disabled={loading || !command.trim()}>
          <span className="font-mono text-xs uppercase tracking-wider">
            {loading ? 'Running...' : 'Run'}
          </span>
        </Button>
      </div>

      {/* Results */}
      {runs.map((run) => (
        <div key={run.id} className="border border-border">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <span className="font-mono text-sm">{run.command}</span>
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

          {/* Output */}
          <div className="divide-y divide-border">
            {run.stdout && (
              <div className="p-4">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  stdout
                </p>
                <pre className="max-h-[250px] overflow-auto font-mono text-xs leading-5 text-foreground/70">
                  {run.stdout}
                </pre>
              </div>
            )}
            {run.stderr && (
              <div className="p-4">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-red-400/70">
                  stderr
                </p>
                <pre className="max-h-[250px] overflow-auto font-mono text-xs leading-5 text-red-400/80">
                  {run.stderr}
                </pre>
              </div>
            )}
            {run.analysis && (
              <div className="p-4">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Analysis
                </p>
                <p className="text-xs leading-relaxed text-foreground/70">{run.analysis}</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
