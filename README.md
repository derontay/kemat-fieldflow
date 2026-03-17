# KeMAT FieldFlow

KeMAT FieldFlow is a Next.js App Router app for small builders and rehab teams. The current deployable scope includes:

- Supabase Auth
- organization bootstrap on first login
- project CRUD
- task CRUD
- vendor CRUD
- expense CRUD
- field updates with project activity feed
- organization-scoped dashboard metrics and recent activity

Stripe and billing are intentionally deferred.

## Current Production Scope

Implemented now:

- Authentication with Supabase
- Protected routes
- Organization bootstrap after first login
- Dashboard overview
- Projects, Tasks, Vendors, and Expenses CRUD
- Project field updates and activity feed

Deferred:

- Stripe
- Billing
- Analytics/export reporting
- Settings implementation beyond placeholder UI

## Required Environment Variables

These are required for the current app in both local and production environments:

```env
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

These are present in `.env.example` for future phases but are not required for the current deployed feature set:

```env
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID=
```

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the example env file:

```bash
cp .env.example .env.local
```

3. Fill in these values in `.env.local`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. Run the app:

```bash
npm run dev
```

5. Open `http://localhost:3000`.

## Supabase Setup

1. Create a Supabase project.
2. In Supabase, enable Email Auth.
3. Add your local and production callback URLs in Supabase Auth settings:
   - `http://localhost:3000/auth/callback`
   - `https://kemat-fieldflow.vercel.app/auth/callback`
4. Copy the project URL and anon key into your environment variables.

## Migration Order

Run these SQL migrations in order:

1. `supabase/migrations/20260317040000_phase_3a_schema.sql`
2. `supabase/migrations/20260318010000_phase_8_field_updates.sql`

Apply them in Supabase SQL Editor or via the Supabase CLI migrations flow.

## Deployment Readiness Notes

The app is safe to deploy with the current feature set if:

- the required env vars are set
- the Supabase migrations above have been applied
- Supabase Auth redirect URLs include your production callback URL

The current app does not require Stripe env vars and does not require a Supabase service role key.

## Deploy To Vercel

1. Push the repository to GitHub, GitLab, or Bitbucket.
2. Create a new Vercel project from that repository.
3. In Vercel Project Settings, add these environment variables:
   - `NEXT_PUBLIC_APP_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Set `NEXT_PUBLIC_APP_URL` to your final production URL, for example:

```env
NEXT_PUBLIC_APP_URL=https://kemat-fieldflow.vercel.app
```

5. Deploy the app.
6. After deploy, go back to Supabase Auth settings and confirm the production callback URL is allowed:
   - `https://kemat-fieldflow.vercel.app/auth/callback`
7. Re-deploy if you changed environment variables after the first build.

## Missing Production Requirements

These should be considered before treating the app as fully production-hardened:

- No automated test suite yet
- No end-to-end deployment validation yet
- No role-based UI restrictions beyond organization-scoped access
- No analytics, exports, or audit logging
- No billing flows
- Settings page is still placeholder-only

## Routes

- `/login`
- `/signup`
- `/reset-password`
- `/dashboard`
- `/projects`
- `/tasks`
- `/expenses`
- `/vendors`
- `/settings`
