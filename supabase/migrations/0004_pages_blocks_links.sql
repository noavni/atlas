-- Atlas — 0004: pages, blocks, links (Phase 2 schema staged up-front so RLS
-- policies have something to attach to)
-- Pages hold the ProseMirror JSONB doc. Blocks are extracted on write for
-- search + backlinks. Links are maintained in app code.

create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  content jsonb not null default '{}'::jsonb,
  parent_page_id uuid references public.pages(id) on delete set null,
  rank text not null default '0|hzzzzz',
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.users(id),
  deleted_at timestamptz
);
create unique index if not exists pages_title_ci_idx
  on public.pages (workspace_id, lower(title)) where deleted_at is null;
create index if not exists pages_live_idx
  on public.pages (workspace_id, parent_page_id, rank) where deleted_at is null;

create trigger pages_touch_updated_at
  before update on public.pages
  for each row execute procedure public.touch_updated_at();

create table if not exists public.blocks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  page_id uuid not null references public.pages(id) on delete cascade,
  type text not null,
  text text,
  parent_block_id uuid references public.blocks(id) on delete cascade,
  rank text not null default '0|hzzzzz',
  depth integer not null default 0,
  attrs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists blocks_page_idx on public.blocks (page_id, rank);
create index if not exists blocks_text_trgm_idx on public.blocks using gin (text gin_trgm_ops);

create trigger blocks_touch_updated_at
  before update on public.blocks
  for each row execute procedure public.touch_updated_at();

create table if not exists public.links (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  source_block_id uuid not null references public.blocks(id) on delete cascade,
  source_page_id uuid not null references public.pages(id) on delete cascade,
  target_page_id uuid references public.pages(id) on delete set null,
  link_text text not null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists links_source_page_idx on public.links (source_page_id);
create index if not exists links_target_page_idx on public.links (target_page_id) where target_page_id is not null;
create index if not exists links_unresolved_idx on public.links (lower(link_text)) where target_page_id is null;

alter table public.pages enable row level security;
alter table public.blocks enable row level security;
alter table public.links enable row level security;
