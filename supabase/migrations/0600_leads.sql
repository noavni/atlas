-- Atlas — 0600: Leads (CRM-lite)
-- Relationships + pipeline layer. Five stages that map to the stage-bar
-- visualization; "lost" and "canceled" live outside the bar. Activities are
-- append-only (we never UPDATE a row, just INSERT — makes the timeline
-- trivially sortable and audit-friendly).

create type public.lead_stage as enum (
  'new', 'contacted', 'qualified', 'proposal', 'won', 'lost'
);

create type public.lead_activity_kind as enum (
  'note', 'call', 'email', 'stage', 'file', 'meeting'
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  role text,
  company text,
  email text,
  phone text,
  location text,
  source text,
  stage public.lead_stage not null default 'new',
  value_cents bigint default 0,
  owner_id uuid references public.users(id) on delete set null,
  tags text[] not null default '{}',
  avatar_color text not null default '#3D49F5',
  avatar_initials text,
  linkedin_url text,
  last_touched_at timestamptz,
  next_step text,
  rank text not null default '0|hzzzzz',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.users(id),
  deleted_at timestamptz
);
create index if not exists leads_live_idx
  on public.leads (workspace_id, stage) where deleted_at is null;
create index if not exists leads_touched_idx
  on public.leads (workspace_id, last_touched_at desc) where deleted_at is null;

create trigger leads_touch_updated_at
  before update on public.leads
  for each row execute procedure public.touch_updated_at();

create table if not exists public.lead_activities (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  actor_id uuid references public.users(id) on delete set null,
  kind public.lead_activity_kind not null,
  headline text not null,
  detail text,
  attrs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists lead_activities_lead_idx
  on public.lead_activities (lead_id, created_at desc);

-- Connection between leads and notes for the Graph + backlinks layers
create table if not exists public.lead_note_links (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  page_id uuid not null references public.pages(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (lead_id, page_id)
);
create index if not exists lead_note_links_page_idx
  on public.lead_note_links (page_id);

-- Lead tasks ("Next steps" card)
create table if not exists public.lead_tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  title text not null,
  due_at timestamptz,
  done boolean not null default false,
  done_at timestamptz,
  rank text not null default '0|hzzzzz',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists lead_tasks_lead_idx
  on public.lead_tasks (lead_id, rank);

create trigger lead_tasks_touch_updated_at
  before update on public.lead_tasks
  for each row execute procedure public.touch_updated_at();

alter table public.leads enable row level security;
alter table public.lead_activities enable row level security;
alter table public.lead_note_links enable row level security;
alter table public.lead_tasks enable row level security;

-- Standard workspace policies
do $$
declare tbl text;
begin
  foreach tbl in array array['leads', 'lead_activities', 'lead_note_links', 'lead_tasks'] loop
    execute format('drop policy if exists %I_read on public.%I;', tbl, tbl);
    execute format(
      'create policy %I_read on public.%I for select using (public.is_workspace_member(workspace_id));',
      tbl, tbl
    );
    execute format('drop policy if exists %I_write on public.%I;', tbl, tbl);
    execute format(
      'create policy %I_write on public.%I for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));',
      tbl, tbl
    );
  end loop;
end $$;

-- Publish leads + activities + tasks to realtime so the UI updates live
alter publication supabase_realtime add table public.leads;
alter publication supabase_realtime add table public.lead_activities;
alter publication supabase_realtime add table public.lead_tasks;
