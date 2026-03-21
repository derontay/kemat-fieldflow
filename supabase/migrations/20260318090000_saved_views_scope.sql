alter table public.saved_views
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

create index if not exists saved_views_user_id_idx
  on public.saved_views (user_id);

drop index if exists saved_views_one_default_per_type_idx;

create unique index if not exists saved_views_one_team_default_per_type_idx
  on public.saved_views (organization_id, type)
  where is_default = true and user_id is null;

create unique index if not exists saved_views_one_personal_default_per_type_idx
  on public.saved_views (organization_id, type, user_id)
  where is_default = true and user_id is not null;

drop policy if exists "saved_views_select_member" on public.saved_views;
create policy "saved_views_select_member"
on public.saved_views
for select
to authenticated
using (
  public.is_org_member(organization_id)
  and (user_id is null or user_id = auth.uid())
);

drop policy if exists "saved_views_insert_member" on public.saved_views;
create policy "saved_views_insert_member"
on public.saved_views
for insert
to authenticated
with check (
  public.is_org_member(organization_id)
  and (user_id is null or user_id = auth.uid())
);

drop policy if exists "saved_views_update_member" on public.saved_views;
create policy "saved_views_update_member"
on public.saved_views
for update
to authenticated
using (
  public.is_org_member(organization_id)
  and (user_id is null or user_id = auth.uid())
)
with check (
  public.is_org_member(organization_id)
  and (user_id is null or user_id = auth.uid())
);

drop policy if exists "saved_views_delete_member" on public.saved_views;
create policy "saved_views_delete_member"
on public.saved_views
for delete
to authenticated
using (
  public.is_org_member(organization_id)
  and (user_id is null or user_id = auth.uid())
);
