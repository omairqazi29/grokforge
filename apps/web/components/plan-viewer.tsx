'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { Plan } from '@/lib/api-client';

interface PlanComment {
  stepIndex: number | null;
  text: string;
}

interface PlanViewerProps {
  plan: Plan;
  onComment?: (comments: PlanComment[]) => void;
  editable?: boolean;
}

export type { PlanComment };

export function PlanViewer({ plan, onComment, editable = true }: PlanViewerProps) {
  const [comments, setComments] = useState<PlanComment[]>([]);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [commentText, setCommentText] = useState('');

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    const updated = [...comments, { stepIndex: activeStep, text: commentText.trim() }];
    setComments(updated);
    onComment?.(updated);
    setCommentText('');
    setActiveStep(null);
  };

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
            {editable && (
              <span className="ml-2 normal-case tracking-normal text-foreground/20">
                — click a step to leave feedback
              </span>
            )}
          </p>
        </div>
        <div className="divide-y divide-border">
          {plan.steps.map((step, i) => {
            const stepComments = comments.filter((c) => c.stepIndex === i);
            return (
              <div key={i}>
                <div
                  className={`flex gap-6 p-6 transition-colors ${editable ? 'cursor-pointer hover:bg-foreground/[0.02]' : ''} ${activeStep === i ? 'bg-foreground/[0.03]' : ''}`}
                  onClick={() => editable && setActiveStep(activeStep === i ? null : i)}
                >
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
                  {editable && (
                    <span className="shrink-0 font-mono text-[10px] text-foreground/0 group-hover:text-foreground/20">
                      {stepComments.length > 0 ? `${stepComments.length}` : '+'}
                    </span>
                  )}
                </div>
                {stepComments.length > 0 && (
                  <div className="border-t border-border/50 bg-foreground/[0.02] px-6 py-3">
                    {stepComments.map((c, ci) => (
                      <div key={ci} className="flex gap-2 py-1">
                        <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                          Step {i + 1}:
                        </span>
                        <span className="text-xs text-foreground/70">{c.text}</span>
                      </div>
                    ))}
                  </div>
                )}
                {activeStep === i && editable && (
                  <div className="border-t border-border px-6 py-4">
                    <Textarea
                      placeholder={`Feedback on step ${step.order}...`}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      rows={2}
                      className="mb-3 font-mono text-xs"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleAddComment} disabled={!commentText.trim()}>
                        <span className="font-mono text-[10px] uppercase tracking-wider">
                          Add Comment
                        </span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setActiveStep(null);
                          setCommentText('');
                        }}
                      >
                        <span className="font-mono text-[10px] uppercase tracking-wider">
                          Cancel
                        </span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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

      {/* All comments summary */}
      {comments.length > 0 && (
        <div className="border border-border p-6">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Review Feedback ({comments.length})
          </p>
          <div className="space-y-2">
            {comments.map((c, i) => (
              <div key={i} className="flex gap-2 text-xs">
                <span className="shrink-0 font-mono text-muted-foreground">
                  {c.stepIndex !== null ? `Step ${c.stepIndex + 1}` : 'General'}:
                </span>
                <span className="text-foreground/70">{c.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
