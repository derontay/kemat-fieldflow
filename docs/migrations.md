# Migration Workflow

Use this workflow whenever app code depends on new database tables, columns, indexes, or policies.

## Rule

Apply database migrations before deploying code that reads or writes the new schema.

## Current Saved Views Requirement

Before deploying the current app, `public.saved_views` must include:

- `id`
- `organization_id`
- `name`
- `type`
- `query_state`
- `created_at`
- `is_pinned`
- `is_default`

## Run Migrations In Supabase SQL Editor

1. Open the correct Supabase project.
2. Open `SQL Editor`.
3. Run the migration files in repo order.

Current relevant order:

1. `supabase/migrations/20260317040000_phase_3a_schema.sql`
2. `supabase/migrations/20260317123000_task_templates.sql`
3. `supabase/migrations/20260317160000_saved_views.sql`
4. `supabase/migrations/20260317170000_saved_views_priority.sql`
5. `supabase/migrations/20260318010000_phase_8_field_updates.sql`

## Verify Columns Exist

Run this in Supabase SQL Editor before deploy:

```sql
select
  column_name,
  data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'saved_views'
order by ordinal_position;
```

You should see both `is_pinned` and `is_default`.

## Verify The App Is Pointing At The Right Supabase Project

1. Check the active app env:
   - `NEXT_PUBLIC_SUPABASE_URL`
2. In Supabase, confirm the open project URL matches that value.
3. Do not run migrations in one project and deploy code against another.

## Required Pre-Deploy Checks

Run these before every production deploy:

1. Confirm the target Supabase project matches `NEXT_PUBLIC_SUPABASE_URL`.
2. Confirm all required migrations for the release have been applied.
3. Verify required columns exist for new features.
4. Run:
   - `npm run typecheck`
   - `npm run test`
5. Verify the app’s production env vars are set in Vercel.

## Saved Views Verification Query

Run this if saved views or pin/default controls look wrong:

```sql
select
  id,
  name,
  type,
  is_pinned,
  is_default,
  query_state,
  created_at
from public.saved_views
order by created_at desc
limit 20;
```

If `is_pinned` or `is_default` do not exist, the latest saved views migration has not been applied to the active project.
