create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.is_org_member(target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = target_org_id
      and om.user_id = auth.uid()
  );
$$;

create or replace function public.is_org_admin(target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = target_org_id
      and om.user_id = auth.uid()
      and om.role in ('owner', 'admin')
  );
$$;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint organizations_name_check check (char_length(trim(name)) > 0),
  constraint organizations_slug_check check (slug = lower(slug) and slug ~ '^[a-z0-9-]+$')
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint organization_members_role_check check (role in ('owner', 'admin', 'member')),
  constraint organization_members_unique unique (organization_id, user_id)
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  address text,
  status text not null default 'planning',
  start_date date,
  target_completion_date date,
  planned_budget numeric(12,2) not null default 0,
  actual_spend numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint projects_org_id_unique unique (id, organization_id),
  constraint projects_name_check check (char_length(trim(name)) > 0),
  constraint projects_status_check check (status in ('planning', 'active', 'on_hold', 'complete')),
  constraint projects_budget_check check (planned_budget >= 0 and actual_spend >= 0)
);

create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  trade text,
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint vendors_org_id_unique unique (id, organization_id),
  constraint vendors_name_check check (char_length(trim(name)) > 0)
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  project_id uuid not null,
  assignee_id uuid references auth.users (id) on delete set null,
  title text not null,
  description text,
  due_date date,
  priority text not null default 'medium',
  status text not null default 'not_started',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint tasks_project_fk
    foreign key (project_id, organization_id)
    references public.projects (id, organization_id)
    on delete cascade,
  constraint tasks_title_check check (char_length(trim(title)) > 0),
  constraint tasks_priority_check check (priority in ('low', 'medium', 'high', 'urgent')),
  constraint tasks_status_check check (status in ('not_started', 'in_progress', 'blocked', 'done'))
);

create table if not exists public.field_updates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  project_id uuid not null,
  author_id uuid references auth.users (id) on delete set null,
  note_text text not null,
  percent_complete integer,
  photo_paths text[] not null default '{}',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint field_updates_project_fk
    foreign key (project_id, organization_id)
    references public.projects (id, organization_id)
    on delete cascade,
  constraint field_updates_note_check check (char_length(trim(note_text)) > 0),
  constraint field_updates_percent_check check (percent_complete is null or percent_complete between 0 and 100)
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  project_id uuid not null,
  vendor_id uuid,
  category text not null,
  amount numeric(12,2) not null,
  expense_date date not null,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint expenses_project_fk
    foreign key (project_id, organization_id)
    references public.projects (id, organization_id)
    on delete cascade,
  constraint expenses_vendor_fk
    foreign key (vendor_id, organization_id)
    references public.vendors (id, organization_id)
    on delete restrict,
  constraint expenses_category_check check (char_length(trim(category)) > 0),
  constraint expenses_amount_check check (amount >= 0)
);

create index if not exists organization_members_user_id_idx
  on public.organization_members (user_id);

create index if not exists organization_members_org_id_idx
  on public.organization_members (organization_id);

create index if not exists projects_organization_id_idx
  on public.projects (organization_id);

create index if not exists projects_organization_id_status_idx
  on public.projects (organization_id, status);

create index if not exists vendors_organization_id_idx
  on public.vendors (organization_id);

create index if not exists tasks_organization_id_idx
  on public.tasks (organization_id);

create index if not exists tasks_project_id_idx
  on public.tasks (project_id);

create index if not exists tasks_assignee_id_idx
  on public.tasks (assignee_id);

create index if not exists field_updates_organization_id_idx
  on public.field_updates (organization_id);

create index if not exists field_updates_project_id_idx
  on public.field_updates (project_id);

create index if not exists field_updates_author_id_idx
  on public.field_updates (author_id);

create index if not exists expenses_organization_id_idx
  on public.expenses (organization_id);

create index if not exists expenses_organization_id_expense_date_idx
  on public.expenses (organization_id, expense_date);

create index if not exists expenses_project_id_idx
  on public.expenses (project_id);

create index if not exists expenses_vendor_id_idx
  on public.expenses (vendor_id);

create or replace function public.handle_new_organization()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.organization_members (organization_id, user_id, role)
  values (new.id, new.created_by, 'owner')
  on conflict (organization_id, user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists organizations_set_updated_at on public.organizations;
create trigger organizations_set_updated_at
before update on public.organizations
for each row
execute function public.set_updated_at();

drop trigger if exists organization_members_set_updated_at on public.organization_members;
create trigger organization_members_set_updated_at
before update on public.organization_members
for each row
execute function public.set_updated_at();

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
before update on public.projects
for each row
execute function public.set_updated_at();

drop trigger if exists vendors_set_updated_at on public.vendors;
create trigger vendors_set_updated_at
before update on public.vendors
for each row
execute function public.set_updated_at();

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
before update on public.tasks
for each row
execute function public.set_updated_at();

drop trigger if exists field_updates_set_updated_at on public.field_updates;
create trigger field_updates_set_updated_at
before update on public.field_updates
for each row
execute function public.set_updated_at();

drop trigger if exists expenses_set_updated_at on public.expenses;
create trigger expenses_set_updated_at
before update on public.expenses
for each row
execute function public.set_updated_at();

drop trigger if exists organizations_create_owner_membership on public.organizations;
create trigger organizations_create_owner_membership
after insert on public.organizations
for each row
execute function public.handle_new_organization();

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.field_updates enable row level security;
alter table public.expenses enable row level security;
alter table public.vendors enable row level security;

drop policy if exists "organizations_select_member" on public.organizations;
create policy "organizations_select_member"
on public.organizations
for select
to authenticated
using (public.is_org_member(id));

drop policy if exists "organizations_insert_authenticated" on public.organizations;
create policy "organizations_insert_authenticated"
on public.organizations
for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists "organizations_update_admin" on public.organizations;
create policy "organizations_update_admin"
on public.organizations
for update
to authenticated
using (public.is_org_admin(id))
with check (public.is_org_admin(id));

drop policy if exists "organizations_delete_owner" on public.organizations;
create policy "organizations_delete_owner"
on public.organizations
for delete
to authenticated
using (
  exists (
    select 1
    from public.organization_members om
    where om.organization_id = organizations.id
      and om.user_id = auth.uid()
      and om.role = 'owner'
  )
);

drop policy if exists "organization_members_select_member" on public.organization_members;
create policy "organization_members_select_member"
on public.organization_members
for select
to authenticated
using (public.is_org_member(organization_id));

drop policy if exists "organization_members_insert_admin" on public.organization_members;
create policy "organization_members_insert_admin"
on public.organization_members
for insert
to authenticated
with check (
  public.is_org_admin(organization_id)
  and (
    role <> 'owner'
    or exists (
      select 1
      from public.organization_members om
      where om.organization_id = organization_members.organization_id
        and om.user_id = auth.uid()
        and om.role = 'owner'
    )
  )
);

drop policy if exists "organization_members_update_admin" on public.organization_members;
create policy "organization_members_update_admin"
on public.organization_members
for update
to authenticated
using (
  public.is_org_admin(organization_id)
  and (
    role <> 'owner'
    or exists (
      select 1
      from public.organization_members om
      where om.organization_id = organization_members.organization_id
        and om.user_id = auth.uid()
        and om.role = 'owner'
    )
  )
)
with check (
  public.is_org_admin(organization_id)
  and (
    role <> 'owner'
    or exists (
      select 1
      from public.organization_members om
      where om.organization_id = organization_members.organization_id
        and om.user_id = auth.uid()
        and om.role = 'owner'
    )
  )
);

drop policy if exists "organization_members_delete_admin" on public.organization_members;
create policy "organization_members_delete_admin"
on public.organization_members
for delete
to authenticated
using (
  public.is_org_admin(organization_id)
  and (
    role <> 'owner'
    or exists (
      select 1
      from public.organization_members om
      where om.organization_id = organization_members.organization_id
        and om.user_id = auth.uid()
        and om.role = 'owner'
    )
  )
);

drop policy if exists "projects_select_member" on public.projects;
create policy "projects_select_member"
on public.projects
for select
to authenticated
using (public.is_org_member(organization_id));

drop policy if exists "projects_insert_member" on public.projects;
create policy "projects_insert_member"
on public.projects
for insert
to authenticated
with check (public.is_org_member(organization_id));

drop policy if exists "projects_update_member" on public.projects;
create policy "projects_update_member"
on public.projects
for update
to authenticated
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

drop policy if exists "projects_delete_member" on public.projects;
create policy "projects_delete_member"
on public.projects
for delete
to authenticated
using (public.is_org_member(organization_id));

drop policy if exists "tasks_select_member" on public.tasks;
create policy "tasks_select_member"
on public.tasks
for select
to authenticated
using (public.is_org_member(organization_id));

drop policy if exists "tasks_insert_member" on public.tasks;
create policy "tasks_insert_member"
on public.tasks
for insert
to authenticated
with check (public.is_org_member(organization_id));

drop policy if exists "tasks_update_member" on public.tasks;
create policy "tasks_update_member"
on public.tasks
for update
to authenticated
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

drop policy if exists "tasks_delete_member" on public.tasks;
create policy "tasks_delete_member"
on public.tasks
for delete
to authenticated
using (public.is_org_member(organization_id));

drop policy if exists "field_updates_select_member" on public.field_updates;
create policy "field_updates_select_member"
on public.field_updates
for select
to authenticated
using (public.is_org_member(organization_id));

drop policy if exists "field_updates_insert_member" on public.field_updates;
create policy "field_updates_insert_member"
on public.field_updates
for insert
to authenticated
with check (public.is_org_member(organization_id));

drop policy if exists "field_updates_update_member" on public.field_updates;
create policy "field_updates_update_member"
on public.field_updates
for update
to authenticated
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

drop policy if exists "field_updates_delete_member" on public.field_updates;
create policy "field_updates_delete_member"
on public.field_updates
for delete
to authenticated
using (public.is_org_member(organization_id));

drop policy if exists "expenses_select_member" on public.expenses;
create policy "expenses_select_member"
on public.expenses
for select
to authenticated
using (public.is_org_member(organization_id));

drop policy if exists "expenses_insert_member" on public.expenses;
create policy "expenses_insert_member"
on public.expenses
for insert
to authenticated
with check (public.is_org_member(organization_id));

drop policy if exists "expenses_update_member" on public.expenses;
create policy "expenses_update_member"
on public.expenses
for update
to authenticated
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

drop policy if exists "expenses_delete_member" on public.expenses;
create policy "expenses_delete_member"
on public.expenses
for delete
to authenticated
using (public.is_org_member(organization_id));

drop policy if exists "vendors_select_member" on public.vendors;
create policy "vendors_select_member"
on public.vendors
for select
to authenticated
using (public.is_org_member(organization_id));

drop policy if exists "vendors_insert_member" on public.vendors;
create policy "vendors_insert_member"
on public.vendors
for insert
to authenticated
with check (public.is_org_member(organization_id));

drop policy if exists "vendors_update_member" on public.vendors;
create policy "vendors_update_member"
on public.vendors
for update
to authenticated
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

drop policy if exists "vendors_delete_member" on public.vendors;
create policy "vendors_delete_member"
on public.vendors
for delete
to authenticated
using (public.is_org_member(organization_id));
