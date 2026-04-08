'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Plan } from '@/lib/api-client';

interface PlanViewerProps {
  plan: Plan;
}

export function PlanViewer({ plan }: PlanViewerProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Goal</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{plan.goal}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {plan.steps.map((step, i) => (
            <div key={i}>
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                  {step.order}
                </div>
                <div className="space-y-1">
                  <p className="text-sm">{step.description}</p>
                  {step.affected_files.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {step.affected_files.map((f) => (
                        <Badge key={f} variant="outline" className="text-xs font-mono">
                          {f}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {i < plan.steps.length - 1 && <Separator className="mt-3" />}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Affected Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {plan.affected_files.map((f) => (
                <p key={f} className="font-mono text-sm text-muted-foreground">
                  {f}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Risks</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-inside list-disc space-y-1">
              {plan.risks.map((r, i) => (
                <li key={i} className="text-sm text-muted-foreground">
                  {r}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Validation Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1">
            {plan.validation_checklist.map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">\u25A1</span>
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
