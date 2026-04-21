-- Atlas — 0100: RLS policies
-- Single helper + per-table policies. inbox_items adds a user_id filter.

create or replace function public.is_workspace_member(wid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.workspace_members
    where workspace_id = wid and user_id = auth.uid()
  );
$$;

-- users: you can read yourself + any co-member of any workspace you're in
drop policy if exists users_self_read on public.users;
create policy users_self_read on public.users
  for select using (
    id = auth.uid()
    or exists(
      select 1
      from public.workspace_members me
      join public.workspace_members them using (workspace_id)
      where me.user_id = auth.uid() and them.user_id = public.users.id
    )
  );
drop policy if exists users_self_write on public.users;
create policy users_self_write on public.users
  for update using (id = auth.uid()) with check (id = auth.uid());

-- workspaces
drop policy if exists ws_member_read on public.workspaces;
create policy ws_member_read on public.workspaces
  for select using (public.is_workspace_member(id));
drop policy if exists ws_owner_write on public.workspaces;
create policy ws_owner_write on public.workspaces
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists ws_insert on public.workspaces;
create policy ws_insert on public.workspaces
  for insert with check (owner_id = auth.uid());

-- workspace_members: members see themselves + co-members; only owners write
drop policy if exists wsm_read on public.workspace_members;
create policy wsm_read on public.workspace_members
  for select using (public.is_workspace_member(workspace_id));
drop policy if exists wsm_write on public.workspace_members;
create policy wsm_write on public.workspace_members
  for all using (
    exists(select 1 from public.workspaces w where w.id = workspace_id and w.owner_id = auth.uid())
  )
  with check (
    exists(select 1 from public.workspaces w where w.id = workspace_id and w.owner_id = auth.uid())
  );

-- Workspace-scoped tables (standard pattern)
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'projects', 'boards', 'columns', 'cards',
    'pages', 'blocks', 'links',
    'attachments', 'tags',
    'embeddings', 'audit_log'
  ]
  loop
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
end
$$;

-- card_tags, page_tags don't have workspace_id; derive from their parent
drop policy if exists card_tags_read on public.card_tags;
create policy card_tags_read on public.card_tags
  for select using (
    exists(select 1 from public.cards c where c.id = card_id and public.is_workspace_member(c.workspace_id))
  );
drop policy if exists card_tags_write on public.card_tags;
create policy card_tags_write on public.card_tags
  for all using (
    exists(select 1 from public.cards c where c.id = card_id and public.is_workspace_member(c.workspace_id))
  )
  with check (
    exists(select 1 from public.cards c where c.id = card_id and public.is_workspace_member(c.workspace_id))
  );

drop policy if exists page_tags_read on public.page_tags;
create policy page_tags_read on public.page_tags
  for select using (
    exists(select 1 from public.pages p where p.id = page_id and public.is_workspace_member(p.workspace_id))
  );
drop policy if exists page_tags_write on public.page_tags;
create policy page_tags_write on public.page_tags
  for all using (
    exists(select 1 from public.pages p where p.id = page_id and public.is_workspace_member(p.workspace_id))
  )
  with check (
    exists(select 1 from public.pages p where p.id = page_id and public.is_workspace_member(p.workspace_id))
  );

-- inbox_items: workspace member AND owned by the caller
drop policy if exists inbox_read on public.inbox_items;
create policy inbox_read on public.inbox_items
  for select using (public.is_workspace_member(workspace_id) and user_id = auth.uid());
drop policy if exists inbox_write on public.inbox_items;
create policy inbox_write on public.inbox_items
  for all using (public.is_workspace_member(workspace_id) and user_id = auth.uid())
  with check (public.is_workspace_member(workspace_id) and user_id = auth.uid());

-- request_log: service-role only (no policies granted; bypass via service key)
