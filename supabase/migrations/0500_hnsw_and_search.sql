-- Atlas — 0500: HNSW index + semantic search RPC
-- HNSW on halfvec(1024) cosine, parameters tuned for small workspaces.
-- Add after the embeddings table exists (0006).

create index if not exists embeddings_hnsw_idx
  on public.embeddings using hnsw (embedding halfvec_cosine_ops)
  with (m = 16, ef_construction = 64);

-- RPC used by /v1/search vector branch. Returns ranked blocks + their page
-- titles joined inline so the API doesn't need a second round-trip.
create or replace function public.atlas_semantic_search(
  query_embedding halfvec(1024),
  ws_id uuid,
  match_count int default 20
) returns table (
  source_kind text,
  source_id uuid,
  page_id uuid,
  chunk_text text,
  title text,
  similarity double precision
)
language sql stable security invoker as $$
  select
    e.source_kind,
    e.source_id,
    e.page_id,
    e.chunk_text,
    coalesce(p.title, '') as title,
    1 - (e.embedding <=> query_embedding) as similarity
  from public.embeddings e
  left join public.pages p on p.id = e.page_id
  where e.workspace_id = ws_id
    and public.is_workspace_member(ws_id)
  order by e.embedding <=> query_embedding
  limit match_count;
$$;

-- Grant execute to authenticated; RLS on embeddings still applies via
-- is_workspace_member() membership gate above.
grant execute on function public.atlas_semantic_search(halfvec, uuid, int) to authenticated;
