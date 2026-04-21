-- Atlas — 0002: workspaces + membership
-- Multi-workspace schema from day one (seeded with one). Two roles for now:
-- owner and member. Admin can be added later without a migration.

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references public.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.users(id),
  deleted_at timestamptz
);
create index if not exists workspaces_live_idx
  on public.workspaces (id) where deleted_at is null;

create trigger workspaces_touch_updated_at
  before update on public.workspaces
  for each row execute procedure public.touch_updated_at();

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);
create index if not exists workspace_members_user_idx
  on public.workspace_members (user_id);

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
