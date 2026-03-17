# Launch Readiness

This document is the final pre-launch verification guide for the current KeMAT FieldFlow scope.

## Automated Checks

Run these locally before shipping:

```bash
npm run typecheck
npm run test
```

`npm run test` currently covers low-risk utility and env helper behavior only. It is not a replacement for manual end-to-end validation.

## Auth Checks

- Login works with a valid Supabase account.
- Signup works and the confirmation email redirect lands on `/auth/callback`.
- Reset-password email flow works end-to-end.
- Sign-out clears the authenticated session.
- Signed-out users cannot access protected routes.

## CRUD Checks

- Projects: create, edit, view, delete.
- Tasks: create, edit, status update, delete.
- Vendors: create, edit, delete.
- Expenses: create, edit, delete.
- Field updates: create and delete from the project detail page.

All CRUD checks must be verified within a real organization-backed account.

## Dashboard Checks

- Dashboard loads for an authenticated user with and without data.
- Project counts are accurate.
- Open and overdue task counts are accurate.
- Total expenses reflect the expense table for the current organization.
- Recent field updates are ordered newest first.

## Settings Checks

- `/settings` loads for an authenticated user.
- Account info renders from the current Supabase user.
- Workspace info renders from the current organization.
- Deployment/setup badges reflect env availability.

## Environment / Deployment Checks

Required production env vars:

```env
NEXT_PUBLIC_APP_URL=https://kemat-fieldflow.vercel.app
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Required Supabase configuration:

- Email auth enabled
- Redirect URL `https://kemat-fieldflow.vercel.app/auth/callback` allowed
- Schema migration `20260317040000_phase_3a_schema.sql` applied
- Schema migration `20260318010000_phase_8_field_updates.sql` applied

## Remaining Launch Risks

- No browser-level end-to-end automation yet.
- No test coverage for server actions, auth redirects, or RLS behavior.
- No deployment smoke test automation.
- No operational monitoring, audit logging, or alerting yet.

## Release Gate

Do not treat the app as launch-ready until:

1. `npm run typecheck` passes.
2. `npm run test` passes.
3. The full checklist in [manual-smoke-checklist.md](./manual-smoke-checklist.md) is completed against the target Supabase project and Vercel deployment.
