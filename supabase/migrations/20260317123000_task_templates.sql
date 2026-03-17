create table if not exists public.task_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint task_templates_org_id_unique unique (id, organization_id),
  constraint task_templates_name_check check (char_length(trim(name)) > 0)
);

create table if not exists public.task_template_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  template_id uuid not null,
  title text not null,
  description text,
  priority text not null default 'medium',
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint task_template_items_template_fk
    foreign key (template_id, organization_id)
    references public.task_templates (id, organization_id)
    on delete cascade,
  constraint task_template_items_title_check check (char_length(trim(title)) > 0),
  constraint task_template_items_priority_check check (priority in ('low', 'medium', 'high', 'urgent')),
  constraint task_template_items_sort_order_check check (sort_order >= 0)
);

create index if not exists task_templates_organization_id_idx
  on public.task_templates (organization_id);

create index if not exists task_template_items_organization_id_idx
  on public.task_template_items (organization_id);

create index if not exists task_template_items_template_id_sort_order_idx
  on public.task_template_items (template_id, sort_order);

drop trigger if exists task_templates_set_updated_at on public.task_templates;
create trigger task_templates_set_updated_at
before update on public.task_templates
for each row
execute function public.set_updated_at();

drop trigger if exists task_template_items_set_updated_at on public.task_template_items;
create trigger task_template_items_set_updated_at
before update on public.task_template_items
for each row
execute function public.set_updated_at();

alter table public.task_templates enable row level security;
alter table public.task_template_items enable row level security;

drop policy if exists "task_templates_select_member" on public.task_templates;
create policy "task_templates_select_member"
on public.task_templates
for select
to authenticated
using (public.is_org_member(organization_id));

drop policy if exists "task_templates_insert_member" on public.task_templates;
create policy "task_templates_insert_member"
on public.task_templates
for insert
to authenticated
with check (public.is_org_member(organization_id));

drop policy if exists "task_templates_update_member" on public.task_templates;
create policy "task_templates_update_member"
on public.task_templates
for update
to authenticated
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

drop policy if exists "task_templates_delete_member" on public.task_templates;
create policy "task_templates_delete_member"
on public.task_templates
for delete
to authenticated
using (public.is_org_member(organization_id));

drop policy if exists "task_template_items_select_member" on public.task_template_items;
create policy "task_template_items_select_member"
on public.task_template_items
for select
to authenticated
using (public.is_org_member(organization_id));

drop policy if exists "task_template_items_insert_member" on public.task_template_items;
create policy "task_template_items_insert_member"
on public.task_template_items
for insert
to authenticated
with check (public.is_org_member(organization_id));

drop policy if exists "task_template_items_update_member" on public.task_template_items;
create policy "task_template_items_update_member"
on public.task_template_items
for update
to authenticated
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

drop policy if exists "task_template_items_delete_member" on public.task_template_items;
create policy "task_template_items_delete_member"
on public.task_template_items
for delete
to authenticated
using (public.is_org_member(organization_id));
