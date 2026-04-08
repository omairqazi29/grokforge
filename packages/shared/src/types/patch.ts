export type PatchStatus = 'pending' | 'accepted' | 'rejected';

export interface PatchFileChange {
  filePath: string;
  originalContent: string;
  patchedContent: string;
  diff: string;
  rationale: string;
}

export interface PatchArtifact {
  id: number;
  sessionId: number;
  changes: PatchFileChange[];
  overallRationale: string;
  status: PatchStatus;
  createdAt: string;
}

export interface GeneratePatchRequest {
  sessionId: number;
  planId: number;
}
