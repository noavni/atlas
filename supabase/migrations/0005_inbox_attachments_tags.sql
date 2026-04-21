-- Atlas — 0005: inbox items, attachments, tags
-- Inbox is per-user (RLS will filter on user_id in addition to workspace).
-- Attachments polymorphic (parent_kind + parent_id). Tags are workspace-scoped.

create table if not exists public.inbox_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  kind text not null check (kind in ('text', 'voice', 'image', 'url', 'file')),
  raw_text text,
  transcript text,
  attachments jsonb not null default '[]'::jsonb,
  source text,
  status text not null default 'inbox' check (status in ('inbox', 'processing', 'processed', 'archived', 'trashed')),
  organized_into_type text check (organized_into_type in ('page', 'card')),
  organized_into_id uuid,
  captured_at timestamptz not null default now(),
  processed_at timestamptz,
  client_idempotency_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create unique index if not exists inbox_idempotency_idx
  on public.inbox_items (user_id, client_idempotency_key) where client_idempotency_key is not null;
create index if not exists inbox_inbox_idx
  on public.inbox_items (user_id, status, captured_at desc) where deleted_at is null;

create trigger inbox_items_touch_updated_at
  before update on public.inbox_items
  for each row execute procedure public.touch_updated_at();

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  storage_path text not null,
  mime_type text,
  size_bytes bigint,
  parent_kind text not null check (parent_kind in ('inbox', 'card', 'page', 'block')),
  parent_id uuid not null,
  created_at timestamptz not null default now(),
  created_by uuid references public.users(id),
  deleted_at timestamptz
);
create index if not exists attachments_parent_idx
  on public.attachments (parent_kind, parent_id) where deleted_at is null;

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  color text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create unique index if not exists tags_workspace_name_idx
  on public.tags (workspace_id, lower(name)) where deleted_at is null;

create table if not exists public.card_tags (
  card_id uuid not null references public.cards(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (card_id, tag_id)
);

create table if not exists public.page_tags (
  page_id uuid not null references public.pages(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (page_id, tag_id)
);

alter table public.inbox_items enable row level security;
alter table public.attachments enable row level security;
alter table public.tags enable row level security;
alter table public.card_tags enable row level security;
alter table public.page_tags enable row level security;
