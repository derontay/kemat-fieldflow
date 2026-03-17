# KeMAT FieldFlow

Phase 2 authentication scaffold for a field-operations web app built with Next.js App Router, Tailwind CSS, and Supabase Auth.

## Scope

Included in the current phase:

- Next.js app scaffold
- Tailwind setup
- Global app shell
- Protected layout with sidebar and top navigation
- Placeholder pages for Dashboard, Projects, Tasks, Expenses, Vendors, and Settings
- Real Supabase Auth for login, signup, logout, and password reset
- Supabase-backed protected route handling
- `.env.example`

Explicitly not included yet:

- Database schema
- Stripe billing integration
- CRUD flows
- Business logic

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables if needed:

```bash
cp .env.example .env.local
```

3. Start the dev server:

```bash
npm run dev
```

4. Open `http://localhost:3000`.

Set Supabase values in `.env.local` before running the app. Authentication now uses real Supabase Auth and protects the existing app shell routes.

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

## Notes

- This phase only covers authentication. Database schema, CRUD flows, dashboard data, and Stripe are still deferred.
