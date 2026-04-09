'use client';

import { useEffect, useState } from 'react';
import { useStepProgression } from '@/hooks/use-step-progression';

interface ThinkingIndicatorProps {
  stage: 'planning' | 'patching' | 'validating' | 'idle';
  files?: string[];
}

const PLANNING_STEPS = [
  { label: 'Indexing repository structure', detail: 'Walking file tree and building graph' },
  { label: 'Extracting symbol definitions', detail: 'Functions, classes, exports across modules' },
  { label: 'Mapping import dependencies', detail: 'Cross-file reference analysis' },
  { label: 'Reading affected source files', detail: 'Loading content for context window' },
  { label: 'Analyzing change impact', detail: 'Identifying downstream effects' },
  { label: 'Evaluating risk vectors', detail: 'Breaking changes, regressions, edge cases' },
  { label: 'Composing validation strategy', detail: 'Test commands, expected outcomes' },
  { label: 'Structuring execution plan', detail: 'Ordering steps by dependency' },
  { label: 'Generating structured output', detail: 'Formatting plan as JSON schema' },
];

const PATCHING_STEPS = [
  { label: 'Loading source file contents', detail: 'Reading current state of affected files' },
  { label: 'Parsing syntax tree', detail: 'Building AST for targeted modifications' },
  { label: 'Identifying edit regions', detail: 'Locating insertion and replacement points' },
  { label: 'Generating code modifications', detail: 'Writing new implementation' },
  { label: 'Computing unified diff', detail: 'Calculating minimal changeset' },
  { label: 'Validating syntax integrity', detail: 'Ensuring patched code parses correctly' },
  { label: 'Composing rationale', detail: 'Explaining why each change was made' },
  { label: 'Finalizing patch artifact', detail: 'Assembling structured output' },
];

const VALIDATING_STEPS = [
  { label: 'Preparing execution environment', detail: 'Setting working directory and env vars' },
  { label: 'Spawning subprocess', detail: 'Executing validation command' },
  { label: 'Streaming output', detail: 'Capturing stdout and stderr' },
  { label: 'Analyzing results', detail: 'Interpreting exit code and output' },
];

const STAGE_LABELS = {
  planning: 'Grok is reasoning about your codebase',
  patching: 'Grok is writing code changes',
  validating: 'Executing validation',
} as const;

export function ThinkingIndicator({ stage, files = [] }: ThinkingIndicatorProps) {
  const [activeFile, setActiveFile] = useState(0);
  const steps =
    stage === 'planning'
      ? PLANNING_STEPS
      : stage === 'patching'
        ? PATCHING_STEPS
        : stage === 'validating'
          ? VALIDATING_STEPS
          : [];
  const { currentStep, completedSteps, elapsed, progress, formatTime } = useStepProgression(
    steps,
    stage,
  );

  useEffect(() => {
    if (files.length === 0) return;
    const interval = setInterval(() => setActiveFile((prev) => (prev + 1) % files.length), 2500);
    return () => clearInterval(interval);
  }, [files]);

  if (stage === 'idle') return null;

  return (
    <div className="border border-border">
      {/* Header with timer and progress */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="relative h-2 w-2">
            <div
              className="absolute inset-0 bg-foreground/30"
              style={{ animation: 'pulse 3s ease-in-out infinite' }}
            />
            <div className="absolute inset-0 bg-foreground" />
          </div>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {STAGE_LABELS[stage]}
          </span>
        </div>
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {formatTime(elapsed)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-px w-full bg-border">
        <div
          className="h-full bg-foreground/40 transition-all duration-1000 ease-out"
          style={{ width: `${Math.max(progress, 5)}%` }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5">
        {/* Steps */}
        <div className="border-r border-border p-6 lg:col-span-3">
          <p className="mb-5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Process &middot; {completedSteps.size}/{steps.length}
          </p>
          <div className="space-y-3">
            {steps.map((step, i) => {
              const done = completedSteps.has(i);
              const active = i === currentStep && !done;
              return (
                <div
                  key={i}
                  className={`transition-all duration-700 ${!done && !active ? 'opacity-30' : 'opacity-100'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
                      {done ? (
                        <svg
                          className="h-3 w-3 text-foreground/50"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : active ? (
                        <div
                          className="h-1.5 w-1.5 bg-foreground"
                          style={{ animation: 'pulse 2s ease-in-out infinite' }}
                        />
                      ) : (
                        <div className="h-0.5 w-0.5 bg-foreground/30" />
                      )}
                    </div>
                    <div>
                      <span
                        className={`font-mono text-xs transition-colors duration-500 ${active ? 'text-foreground' : done ? 'text-foreground/50' : 'text-foreground/25'}`}
                      >
                        {step.label}
                      </span>
                      {active && (
                        <p className="mt-1 text-[11px] text-muted-foreground">{step.detail}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Files being analyzed */}
        <div className="p-6 lg:col-span-2">
          <p className="mb-5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {stage === 'planning' ? 'Scanning' : 'Processing'}
          </p>
          {files.length > 0 ? (
            <div className="space-y-2">
              {files.slice(0, 10).map((file, i) => {
                const isActive = i === activeFile;
                const wasActive = i < activeFile;
                return (
                  <div
                    key={file}
                    className={`flex items-center gap-2.5 transition-all duration-700 ${isActive ? 'text-foreground' : wasActive ? 'text-foreground/30' : 'text-foreground/15'}`}
                  >
                    <div className="flex h-3 w-3 shrink-0 items-center justify-center">
                      {isActive ? (
                        <div
                          className="h-1 w-1 bg-foreground"
                          style={{ animation: 'pulse 2.5s ease-in-out infinite' }}
                        />
                      ) : wasActive ? (
                        <div className="h-0.5 w-0.5 bg-foreground/30" />
                      ) : null}
                    </div>
                    <span className="truncate font-mono text-xs">{file}</span>
                  </div>
                );
              })}
              {files.length > 10 && (
                <p className="mt-2 pl-5 font-mono text-[10px] text-foreground/20">
                  +{files.length - 10} more
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-2 bg-foreground/5"
                  style={{
                    width: `${40 + i * 10}%`,
                    animation: `pulse 4s ease-in-out ${i * 0.4}s infinite`,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
