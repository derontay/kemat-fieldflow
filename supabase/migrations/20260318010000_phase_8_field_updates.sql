alter table public.field_updates
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists created_by uuid references auth.users (id) on delete set null;

update public.field_updates
set
  title = coalesce(nullif(title, ''), 'Field Update'),
  description = coalesce(description, note_text),
  created_by = coalesce(created_by, author_id)
where
  title is null
  or description is null
  or created_by is null;

alter table public.field_updates
  alter column title set not null;

alter table public.field_updates
  alter column title set default 'Field Update';

create index if not exists field_updates_created_by_idx
  on public.field_updates (created_by);
