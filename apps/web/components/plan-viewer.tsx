'use client';

import type { Plan } from '@/lib/api-client';

interface PlanViewerProps {
  plan: Plan;
}

export function PlanViewer({ plan }: PlanViewerProps) {
  return (
    <div className="space-y-6">
      {/* Goal */}
      <div className="border border-border p-6">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Goal
        </p>
        <p className="text-sm leading-relaxed">{plan.goal}</p>
      </div>

      {/* Steps */}
      <div className="border border-border">
        <div className="border-b border-border px-6 py-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Execution Steps
          </p>
        </div>
        <div className="divide-y divide-border">
          {plan.steps.map((step, i) => (
            <div key={i} className="flex gap-6 p-6">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center border border-border font-mono text-xs">
                {step.order}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-relaxed">{step.description}</p>
                {step.affected_files.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {step.affected_files.map((f) => (
                      <span
                        key={f}
                        className="border border-border px-2 py-0.5 font-mono text-xs text-muted-foreground"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Affected Files + Risks side by side */}
      <div className="grid grid-cols-1 gap-px border border-border bg-border lg:grid-cols-2">
        <div className="bg-background p-6">
          <p className="mb-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Affected Files
          </p>
          <div className="space-y-1.5">
            {plan.affected_files.map((f) => (
              <p key={f} className="font-mono text-xs text-foreground/70">
                {f}
              </p>
            ))}
          </div>
        </div>
        <div className="bg-background p-6">
          <p className="mb-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Risks
          </p>
          <div className="space-y-2">
            {plan.risks.map((r, i) => (
              <div key={i} className="flex gap-2">
                <span className="mt-0.5 shrink-0 font-mono text-xs text-muted-foreground">!</span>
                <p className="text-xs leading-relaxed text-foreground/70">{r}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Validation Checklist */}
      <div className="border border-border p-6">
        <p className="mb-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Validation Checklist
        </p>
        <div className="space-y-2">
          {plan.validation_checklist.map((item, i) => (
            <label key={i} className="flex cursor-pointer items-start gap-3 text-xs">
              <input type="checkbox" className="mt-0.5 accent-foreground" />
              <span className="leading-relaxed text-foreground/70">{item}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
