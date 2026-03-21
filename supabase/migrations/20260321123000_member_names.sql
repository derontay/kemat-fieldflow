create or replace function public.get_org_members_with_emails(target_org_id uuid)
returns table (
  id uuid,
  organization_id uuid,
  user_id uuid,
  full_name text,
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
    coalesce(
      nullif(u.raw_user_meta_data ->> 'full_name', ''),
      nullif(u.raw_user_meta_data ->> 'name', '')
    )::text,
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
