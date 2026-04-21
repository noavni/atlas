-- Atlas — one-time workspace seed
-- Run AFTER you and your partner have both signed in at least once (so
-- rows exist in auth.users / public.users). Execute in the Supabase SQL
-- editor at https://supabase.com/dashboard/project/gurtxcfjakaxazqbfnaf/sql/new.

-- 1. Find the user IDs for you both (by email).
-- select id, email from public.users;

-- 2. Create the workspace owned by you. Replace <YOUR_USER_ID> + <PARTNER_USER_ID>
--    with the uuids from step 1.

do $$
declare
  v_ws_id uuid := gen_random_uuid();
  v_you   uuid := '<YOUR_USER_ID>'::uuid;
  v_them  uuid := '<PARTNER_USER_ID>'::uuid;
begin
  insert into public.workspaces (id, name, owner_id, created_by)
  values (v_ws_id, 'Atlas', v_you, v_you);

  insert into public.workspace_members (workspace_id, user_id, role) values
    (v_ws_id, v_you, 'owner'),
    (v_ws_id, v_them, 'member');

  -- Starter project + board + columns so the Kanban has somewhere to live.
  insert into public.projects (id, workspace_id, name, rank, created_by) values
    (gen_random_uuid(), v_ws_id, 'Home', '0|V', v_you),
    (gen_random_uuid(), v_ws_id, 'Trip to Lisbon', '0|W', v_you),
    (gen_random_uuid(), v_ws_id, 'Reading list 2026', '0|X', v_you);

  raise notice 'seeded workspace %', v_ws_id;
end $$;
