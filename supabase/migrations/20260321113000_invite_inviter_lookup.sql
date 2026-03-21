create or replace function public.get_org_invite_by_token(invite_token text)
returns table (
  id uuid,
  organization_id uuid,
  organization_name text,
  email text,
  role text,
  token text,
  invited_by uuid,
  inviter_email text,
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
    oi.invited_by,
    inviter.email::text,
    oi.expires_at,
    oi.accepted_at,
    oi.created_at
  from public.organization_invites oi
  join public.organizations o on o.id = oi.organization_id
  join auth.users inviter on inviter.id = oi.invited_by
  where oi.token = invite_token
  limit 1;
$$;
