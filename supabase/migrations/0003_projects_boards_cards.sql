-- Atlas — 0003: projects, boards, columns, cards
-- LexoRank-style fractional rank strings for all orderable lists.
-- `workflow_state` is the Linear-style typed enum.

create type public.workflow_state as enum (
  'backlog', 'todo', 'in_progress', 'in_review', 'done', 'canceled'
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'active',
  rank text not null default '0|hzzzzz',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.users(id),
  deleted_at timestamptz
);
create index if not exists projects_live_idx
  on public.projects (workspace_id) where deleted_at is null;

create trigger projects_touch_updated_at
  before update on public.projects
  for each row execute procedure public.touch_updated_at();

create table if not exists public.boards (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  rank text not null default '0|hzzzzz',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.users(id),
  deleted_at timestamptz
);
create index if not exists boards_live_idx
  on public.boards (project_id) where deleted_at is null;

create trigger boards_touch_updated_at
  before update on public.boards
  for each row execute procedure public.touch_updated_at();

create table if not exists public.columns (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  board_id uuid not null references public.boards(id) on delete cascade,
  name text not null,
  rank text not null default '0|hzzzzz',
  default_workflow_state public.workflow_state,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists columns_live_idx
  on public.columns (board_id) where deleted_at is null;

create trigger columns_touch_updated_at
  before update on public.columns
  for each row execute procedure public.touch_updated_at();

create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  board_id uuid not null references public.boards(id) on delete cascade,
  column_id uuid not null references public.columns(id) on delete cascade,
  title text not null,
  description text,
  workflow_state public.workflow_state not null default 'todo',
  rank text not null default '0|hzzzzz',
  assignee_id uuid references public.users(id) on delete set null,
  due_at timestamptz,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.users(id),
  deleted_at timestamptz
);
create index if not exists cards_live_idx
  on public.cards (board_id, column_id, rank) where deleted_at is null;
create index if not exists cards_workspace_idx
  on public.cards (workspace_id) where deleted_at is null;

create trigger cards_touch_updated_at
  before update on public.cards
  for each row execute procedure public.touch_updated_at();

alter table public.projects enable row level security;
alter table public.boards enable row level security;
alter table public.columns enable row level security;
alter table public.cards enable row level security;
