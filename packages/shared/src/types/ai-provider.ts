import type { PlanStep } from './plan';
import type { PatchFileChange } from './patch';

export interface RepoSummary {
  description: string;
  techStack: string[];
  architecture: string;
  keyFiles: string[];
}

export interface RepoContext {
  fileTree: string[];
  symbolIndex: Record<string, string[]>;
  summary: RepoSummary;
  sampleFiles: Record<string, string>;
}

export interface GeneratedPlan {
  goal: string;
  steps: PlanStep[];
  affectedFiles: string[];
  risks: string[];
  validationChecklist: string[];
}

export interface GeneratedPatch {
  changes: PatchFileChange[];
  overallRationale: string;
}

export interface ValidationAnalysis {
  passed: boolean;
  summary: string;
  issues: string[];
  suggestedFixes: string[];
}
