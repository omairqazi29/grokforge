export interface PlanStep {
  order: number;
  description: string;
  affectedFiles: string[];
}

export interface Plan {
  id: number;
  sessionId: number;
  goal: string;
  steps: PlanStep[];
  affectedFiles: string[];
  risks: string[];
  validationChecklist: string[];
  createdAt: string;
}
