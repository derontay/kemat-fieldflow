create table if not exists public.saved_views (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  type text not null,
  query_state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint saved_views_name_check check (char_length(trim(name)) > 0),
  constraint saved_views_type_check check (type in ('tasks', 'expenses'))
);

create index if not exists saved_views_organization_id_idx
  on public.saved_views (organization_id);

create index if not exists saved_views_organization_id_type_idx
  on public.saved_views (organization_id, type);

alter table public.saved_views enable row level security;

drop policy if exists "saved_views_select_member" on public.saved_views;
create policy "saved_views_select_member"
on public.saved_views
for select
to authenticated
using (public.is_org_member(organization_id));

drop policy if exists "saved_views_insert_member" on public.saved_views;
create policy "saved_views_insert_member"
on public.saved_views
for insert
to authenticated
with check (public.is_org_member(organization_id));

drop policy if exists "saved_views_update_member" on public.saved_views;
create policy "saved_views_update_member"
on public.saved_views
for update
to authenticated
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

drop policy if exists "saved_views_delete_member" on public.saved_views;
create policy "saved_views_delete_member"
on public.saved_views
for delete
to authenticated
using (public.is_org_member(organization_id));
