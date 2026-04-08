export type SessionStatus =
  | 'created'
  | 'planning'
  | 'planned'
  | 'patching'
  | 'validating'
  | 'reviewing'
  | 'completed';

export interface Session {
  id: number;
  repositoryId: number;
  title: string;
  taskDescription: string;
  constraints: string[];
  status: SessionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSessionRequest {
  repositoryId: number;
  title: string;
  taskDescription: string;
  constraints?: string[];
}
