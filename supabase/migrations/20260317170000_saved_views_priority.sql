alter table public.saved_views
  add column if not exists is_pinned boolean not null default false,
  add column if not exists is_default boolean not null default false;

create unique index if not exists saved_views_one_default_per_type_idx
  on public.saved_views (organization_id, type)
  where is_default = true;
