# Deploy Checklist

Use this checklist for every production deployment to Vercel.

## 1. Verify Environment Target

Confirm the app will deploy against the correct Supabase project:

1. Check Vercel production env vars:
   - `NEXT_PUBLIC_APP_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Confirm `NEXT_PUBLIC_SUPABASE_URL` matches the Supabase project where you ran migrations.

## 2. Apply Migrations First

Before pushing code that depends on schema changes:

1. Open the correct Supabase project.
2. Run any new SQL migrations in `supabase/migrations/`.
3. Verify critical columns exist.

For the current saved views feature, verify:

- `public.saved_views.is_pinned`
- `public.saved_views.is_default`

See [migrations.md](/C:/Users/d504s/kemat-fieldflow/docs/migrations.md) for verification queries.

## 3. Run Local Checks

Run:

```bash
npm run typecheck
npm run test
```

## 4. Deploy

If you deploy via Git:

1. Commit the release changes.
2. Push to the production branch.
3. Wait for Vercel production deploy to finish.

If you deploy via Vercel CLI:

```bash
vercel deploy --prod
```

## 5. Verify Production After Deploy

Check these routes:

1. `/login`
2. `/tasks`
3. `/expenses`

Then sign in and verify:

1. tasks page loads
2. expenses page loads
3. saved views list appears
4. pin/unpin control is visible
5. set default control is visible
6. setting a default view works

## 6. If Saved Views Falls Back

The server will log:

`DB schema is outdated. Apply latest migrations.`

If you see that warning:

1. stop the rollout
2. verify the active Supabase project matches `NEXT_PUBLIC_SUPABASE_URL`
3. apply the missing migration
4. redeploy if needed

## 7. Minimum Safe Release Gate

Do not treat a deploy as complete until:

- migrations are applied
- env vars match the intended Supabase project
- `/tasks` works
- `/expenses` works
- saved views pin/default controls appear
