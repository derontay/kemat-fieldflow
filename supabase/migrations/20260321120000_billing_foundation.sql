alter table public.organizations
  add column if not exists plan text not null default 'free',
  add constraint organizations_plan_check check (plan in ('free', 'pro'));

create table if not exists public.app_settings (
  id boolean primary key default true,
  billing_enabled boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint app_settings_singleton_check check (id = true)
);

insert into public.app_settings (id, billing_enabled)
values (true, false)
on conflict (id) do nothing;

drop trigger if exists app_settings_set_updated_at on public.app_settings;
create trigger app_settings_set_updated_at
before update on public.app_settings
for each row
execute function public.set_updated_at();

alter table public.app_settings enable row level security;

drop policy if exists "app_settings_select_authenticated" on public.app_settings;
create policy "app_settings_select_authenticated"
on public.app_settings
for select
to authenticated
using (true);

drop policy if exists "app_settings_update_authenticated" on public.app_settings;
create policy "app_settings_update_authenticated"
on public.app_settings
for update
to authenticated
using (true)
with check (true);
