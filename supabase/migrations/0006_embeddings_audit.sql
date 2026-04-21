-- Atlas — 0006: embeddings + audit log + idempotency cache
-- halfvec(1024) for Voyage voyage-3-large; HNSW index lands in Phase 4 when
-- the first rows arrive (deferred since building HNSW on empty table is a
-- no-op anyway).

create table if not exists public.embeddings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  source_kind text not null check (source_kind in ('block', 'card', 'inbox')),
  source_id uuid not null,
  page_id uuid references public.pages(id) on delete cascade,
  chunk_text text not null,
  token_count integer,
  embedding halfvec(1024),
  model_version text not null default 'voyage-3-large',
  created_at timestamptz not null default now()
);
create index if not exists embeddings_source_idx
  on public.embeddings (source_kind, source_id);
create index if not exists embeddings_workspace_idx
  on public.embeddings (workspace_id);
-- HNSW index deferred until Phase 4 (add via a later migration once we have
-- embeddings in place): create index ... using hnsw (embedding halfvec_cosine_ops)

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_id uuid references public.users(id),
  action text not null,
  entity_kind text not null,
  entity_id uuid,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_log_workspace_idx
  on public.audit_log (workspace_id, created_at desc);

-- Idempotency cache for non-GET mutations
create table if not exists public.request_log (
  key text primary key,
  user_id uuid references public.users(id),
  method text not null,
  path text not null,
  status_code integer not null,
  response_body jsonb,
  created_at timestamptz not null default now()
);
create index if not exists request_log_cleanup_idx on public.request_log (created_at);

alter table public.embeddings enable row level security;
alter table public.audit_log enable row level security;
alter table public.request_log enable row level security;
