export interface ValidationRun {
  id: number;
  sessionId: number;
  patchArtifactId: number;
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  analysis: string;
  durationMs: number;
  createdAt: string;
}

export interface RunValidationRequest {
  command: string;
  patchArtifactId: number;
}
