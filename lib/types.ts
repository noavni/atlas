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

// --- Leads -----------------------------------------------------------------
export type LeadStage = "new" | "contacted" | "qualified" | "proposal" | "won" | "lost";

export type LeadActivityKind = "note" | "call" | "email" | "stage" | "file" | "meeting";

export interface Lead {
  id: string;
  workspace_id: string;
  name: string;
  role: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  source: string | null;
  stage: LeadStage;
  value_cents: number;
  owner_id: string | null;
  tags: string[];
  avatar_color: string;
  avatar_initials: string | null;
  linkedin_url: string | null;
  last_touched_at: string | null;
  next_step: string | null;
  rank: string;
  created_at: string;
  updated_at: string;
}

export interface LeadActivity {
  id: string;
  lead_id: string;
  actor_id: string | null;
  kind: LeadActivityKind;
  headline: string;
  detail: string | null;
  attrs: Record<string, unknown>;
  created_at: string;
}

export interface LeadTask {
  id: string;
  lead_id: string;
  title: string;
  due_at: string | null;
  done: boolean;
  done_at: string | null;
  rank: string;
  created_at: string;
  updated_at: string;
}

export interface LeadDetail {
  lead: Lead;
  activities: LeadActivity[];
  tasks: LeadTask[];
}
