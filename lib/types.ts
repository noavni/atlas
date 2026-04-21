export type WorkflowState =
  | "backlog"
  | "todo"
  | "in_progress"
  | "in_review"
  | "done"
  | "canceled";

export interface Workspace {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  status: string;
  rank: string;
  created_at: string;
  updated_at: string;
}

export interface Board {
  id: string;
  workspace_id: string;
  project_id: string;
  name: string;
  rank: string;
  created_at: string;
  updated_at: string;
}

export interface BoardColumn {
  id: string;
  workspace_id: string;
  board_id: string;
  name: string;
  rank: string;
  default_workflow_state: WorkflowState | null;
  created_at: string;
  updated_at: string;
}

export interface Card {
  id: string;
  workspace_id: string;
  project_id: string;
  board_id: string;
  column_id: string;
  title: string;
  description: string | null;
  workflow_state: WorkflowState;
  rank: string;
  assignee_id: string | null;
  due_at: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}
