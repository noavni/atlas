-- Atlas — 0200: Realtime publications
-- Only publish tables the frontend actively subscribes to. Keeps bandwidth
-- under Supabase Free's 2 GB/mo and reduces subscriber fanout cost.

alter publication supabase_realtime add table
  public.cards,
  public.columns,
  public.pages,
  public.blocks,
  public.inbox_items;
