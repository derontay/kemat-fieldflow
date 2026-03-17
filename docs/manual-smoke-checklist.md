# Manual Smoke Checklist

Use this checklist before launch and after each production deploy.

## Auth

- Visit `/login` while signed out and confirm the page renders without a client crash.
- Sign in with a valid account and confirm redirect to `/dashboard`.
- Sign out from a protected page and confirm redirect back to `/login`.
- Run the reset-password flow and confirm:
  - reset email is sent
  - callback returns to `/reset-password?mode=update`
  - password update succeeds
  - old password no longer works

## Organization Bootstrap

- Create a brand-new user account.
- Confirm first protected entry creates a workspace automatically.
- Confirm the sidebar/workspace shell shows the real organization name instead of a demo label.
- Confirm `/settings` shows the expected user email, workspace name, and role.

## Projects CRUD

- Create a project with all fields populated.
- Edit that project and confirm changes persist.
- Open the project detail page and confirm data matches the edit form.
- Delete the project and confirm it no longer appears in `/projects`.

## Tasks CRUD

- Create a task linked to a project.
- Edit the task and move it to another project in the same organization.
- Update task status from the tasks list page.
- Delete the task and confirm it disappears from `/tasks`.

## Vendors CRUD

- Create a vendor.
- Edit the vendor.
- Delete the vendor and confirm it disappears from `/vendors`.

## Expenses CRUD

- Create an expense linked to a project.
- Create an expense with and without a vendor.
- Edit the expense.
- Delete the expense and confirm it disappears from `/expenses`.

## Field Updates / Activity Feed

- Open a project detail page.
- Add a field update with title and description.
- Confirm it appears at the top of the activity feed.
- Delete the update and confirm it disappears.

## Dashboard

- Confirm the dashboard renders without error for an account with data.
- Confirm metric counts change after adding/removing projects, tasks, expenses, and field updates.
- Confirm recent field updates are sorted newest first.

## Protected Routing

- Attempt to open `/dashboard`, `/projects`, `/tasks`, `/vendors`, `/expenses`, and `/settings` while signed out.
- Confirm each route redirects to `/login`.

## Deployment / Env

- Confirm Vercel has:
  - `NEXT_PUBLIC_APP_URL`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Confirm Supabase Auth allowed redirect URLs include:
  - `http://localhost:3000/auth/callback`
  - `https://kemat-fieldflow.vercel.app/auth/callback`
- Confirm the latest two SQL migrations are applied in Supabase.

## Error Paths

- Open a stale edit/detail URL for a deleted record and confirm the app fails gracefully.
- Temporarily break a required env var in a non-production environment and confirm the failure is explicit.
