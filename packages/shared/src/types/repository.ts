export interface Repository {
  id: number;
  name: string;
  path: string;
  fileTree: string[];
  symbolIndex: Record<string, string[]>;
  summary: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRepositoryRequest {
  path: string;
}
