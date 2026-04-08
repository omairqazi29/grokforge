'use client';

import { useEffect, useState } from 'react';

interface ThinkingIndicatorProps {
  stage: 'planning' | 'patching' | 'validating' | 'idle';
  files?: string[];
}

const PLANNING_STEPS = [
  { label: 'Analyzing repository structure', duration: 1200 },
  { label: 'Scanning symbol index', duration: 800 },
  { label: 'Mapping file dependencies', duration: 1000 },
  { label: 'Identifying affected modules', duration: 900 },
  { label: 'Evaluating change impact', duration: 1100 },
  { label: 'Assessing risk vectors', duration: 700 },
  { label: 'Building validation checklist', duration: 600 },
  { label: 'Structuring execution plan', duration: 800 },
];

const PATCHING_STEPS = [
  { label: 'Reading source files', duration: 800 },
  { label: 'Parsing abstract syntax tree', duration: 1000 },
  { label: 'Computing minimal diff', duration: 1200 },
  { label: 'Generating patched content', duration: 1500 },
  { label: 'Validating syntax integrity', duration: 700 },
  { label: 'Writing change rationale', duration: 900 },
];

const VALIDATING_STEPS = [
  { label: 'Spawning validation runner', duration: 600 },
  { label: 'Executing command', duration: 2000 },
  { label: 'Capturing output streams', duration: 500 },
  { label: 'Analyzing results', duration: 800 },
];

export function ThinkingIndicator({ stage, files = [] }: ThinkingIndicatorProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [activeFile, setActiveFile] = useState(0);

  const steps =
    stage === 'planning'
      ? PLANNING_STEPS
      : stage === 'patching'
        ? PATCHING_STEPS
        : stage === 'validating'
          ? VALIDATING_STEPS
          : [];

  // Cycle through steps
  useEffect(() => {
    if (stage === 'idle' || steps.length === 0) return;
    setCurrentStep(0);
    setCompletedSteps([]);

    let stepIdx = 0;
    const advance = () => {
      setCompletedSteps((prev) => [...prev, stepIdx]);
      stepIdx = (stepIdx + 1) % steps.length;
      setCurrentStep(stepIdx);
      if (stepIdx === 0) setCompletedSteps([]);
    };

    const intervals: NodeJS.Timeout[] = [];
    let delay = 0;
    for (let i = 0; i < steps.length; i++) {
      delay += steps[i].duration;
      intervals.push(setTimeout(advance, delay));
    }
    // Loop
    const loopInterval = setInterval(() => {
      stepIdx = 0;
      setCurrentStep(0);
      setCompletedSteps([]);
      let d = 0;
      for (let i = 0; i < steps.length; i++) {
        d += steps[i].duration;
        setTimeout(() => {
          setCompletedSteps((prev) => [...prev, i]);
          setCurrentStep((i + 1) % steps.length);
        }, d);
      }
    }, delay + 500);

    return () => {
      intervals.forEach(clearTimeout);
      clearInterval(loopInterval);
    };
  }, [stage]);

  // Cycle through files
  useEffect(() => {
    if (files.length === 0) return;
    const interval = setInterval(() => {
      setActiveFile((prev) => (prev + 1) % files.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [files]);

  if (stage === 'idle') return null;

  return (
    <div className="border border-border">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-6 py-4">
        <div className="relative h-3 w-3">
          <div className="absolute inset-0 animate-ping bg-foreground/20" />
          <div className="absolute inset-0.5 bg-foreground" />
        </div>
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {stage === 'planning' && 'Grok is planning'}
          {stage === 'patching' && 'Grok is generating patches'}
          {stage === 'validating' && 'Running validation'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Steps */}
        <div className="border-r border-border p-6">
          <div className="space-y-2">
            {steps.map((step, i) => {
              const isCompleted = completedSteps.includes(i);
              const isCurrent = i === currentStep;
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                    {isCompleted ? (
                      <span className="font-mono text-xs text-foreground/60">&#10003;</span>
                    ) : isCurrent ? (
                      <div className="h-1.5 w-1.5 animate-pulse bg-foreground" />
                    ) : (
                      <div className="h-1 w-1 bg-foreground/20" />
                    )}
                  </div>
                  <span
                    className={`font-mono text-xs transition-colors ${
                      isCurrent
                        ? 'text-foreground'
                        : isCompleted
                          ? 'text-foreground/40'
                          : 'text-foreground/20'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Files being analyzed */}
        <div className="p-6">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {stage === 'planning' ? 'Scanning Files' : 'Processing'}
          </p>
          {files.length > 0 ? (
            <div className="space-y-1.5">
              {files.slice(0, 8).map((file, i) => (
                <div
                  key={file}
                  className={`flex items-center gap-2 transition-all duration-300 ${
                    i === activeFile ? 'text-foreground' : 'text-foreground/20'
                  }`}
                >
                  {i === activeFile && <div className="h-1 w-1 animate-pulse bg-foreground" />}
                  <span className="font-mono text-xs">{file}</span>
                </div>
              ))}
              {files.length > 8 && (
                <p className="font-mono text-[10px] text-muted-foreground">
                  +{files.length - 8} more files
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-3 animate-pulse bg-foreground/5"
                  style={{ width: `${60 + Math.random() * 30}%`, animationDelay: `${i * 200}ms` }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
