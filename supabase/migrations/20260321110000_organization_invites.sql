create table if not exists public.organization_invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  email text,
  role text not null default 'member',
  token text not null unique,
  invited_by uuid not null references auth.users (id) on delete restrict,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  constraint organization_invites_role_check check (role in ('admin', 'member'))
);

create index if not exists organization_invites_organization_id_idx
  on public.organization_invites (organization_id);

create index if not exists organization_invites_email_idx
  on public.organization_invites (lower(email));

create index if not exists organization_invites_token_idx
  on public.organization_invites (token);

alter table public.organization_invites enable row level security;

drop policy if exists "organization_invites_select_admin" on public.organization_invites;
create policy "organization_invites_select_admin"
on public.organization_invites
for select
to authenticated
using (public.is_org_admin(organization_id));

drop policy if exists "organization_invites_insert_admin" on public.organization_invites;
create policy "organization_invites_insert_admin"
on public.organization_invites
for insert
to authenticated
with check (public.is_org_admin(organization_id));

drop policy if exists "organization_invites_update_admin" on public.organization_invites;
create policy "organization_invites_update_admin"
on public.organization_invites
for update
to authenticated
using (public.is_org_admin(organization_id))
with check (public.is_org_admin(organization_id));

drop policy if exists "organization_invites_delete_admin" on public.organization_invites;
create policy "organization_invites_delete_admin"
on public.organization_invites
for delete
to authenticated
using (public.is_org_admin(organization_id));

create or replace function public.get_org_members_with_emails(target_org_id uuid)
returns table (
  id uuid,
  organization_id uuid,
  user_id uuid,
  email text,
  role text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    om.id,
    om.organization_id,
    om.user_id,
    u.email::text,
    om.role,
    om.created_at
  from public.organization_members om
  join auth.users u on u.id = om.user_id
  where om.organization_id = target_org_id
    and public.is_org_member(target_org_id)
  order by
    case om.role
      when 'owner' then 0
      when 'admin' then 1
      else 2
    end,
    lower(coalesce(u.email, ''));
$$;

create or replace function public.get_org_invite_by_token(invite_token text)
returns table (
  id uuid,
  organization_id uuid,
  organization_name text,
  email text,
  role text,
  token text,
  expires_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    oi.id,
    oi.organization_id,
    o.name,
    oi.email,
    oi.role,
    oi.token,
    oi.expires_at,
    oi.accepted_at,
    oi.created_at
  from public.organization_invites oi
  join public.organizations o on o.id = oi.organization_id
  where oi.token = invite_token
  limit 1;
$$;

create or replace function public.accept_organization_invite(invite_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  invite_row public.organization_invites%rowtype;
  current_user_email text;
  existing_org_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required to accept an invite.';
  end if;

  select u.email::text
  into current_user_email
  from auth.users u
  where u.id = auth.uid();

  select *
  into invite_row
  from public.organization_invites
  where token = invite_token
  for update;

  if not found then
    raise exception 'Invite not found.';
  end if;

  if invite_row.accepted_at is not null then
    raise exception 'Invite already accepted.';
  end if;

  if invite_row.expires_at < timezone('utc', now()) then
    raise exception 'Invite expired.';
  end if;

  if invite_row.email is not null
     and lower(invite_row.email) <> lower(coalesce(current_user_email, '')) then
    raise exception 'Invite email does not match the current account.';
  end if;

  select om.organization_id
  into existing_org_id
  from public.organization_members om
  where om.user_id = auth.uid()
  limit 1;

  if existing_org_id is not null and existing_org_id <> invite_row.organization_id then
    raise exception 'This account already belongs to another organization in the current MVP.';
  end if;

  insert into public.organization_members (organization_id, user_id, role)
  values (invite_row.organization_id, auth.uid(), invite_row.role)
  on conflict (organization_id, user_id) do nothing;

  update public.organization_invites
  set accepted_at = timezone('utc', now())
  where id = invite_row.id;

  return invite_row.organization_id;
end;
$$;
