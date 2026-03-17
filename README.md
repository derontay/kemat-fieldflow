# KeMAT FieldFlow

Phase 1 scaffold for a field-operations web app built with Next.js App Router and Tailwind CSS.

## Scope

Included in Phase 1:

- Next.js app scaffold
- Tailwind setup
- Global app shell
- Protected layout with sidebar and top navigation
- Placeholder pages for Dashboard, Projects, Tasks, Expenses, Vendors, and Settings
- Placeholder auth pages for login, signup, and reset password
- Cookie-based route protection for scaffold verification
- `.env.example`

Explicitly not included in Phase 1:

- Database schema
- Supabase data model integration
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

Use the placeholder login or signup screens to enter the protected app shell. In Phase 1, auth is scaffold-only and sets a local cookie instead of talking to a backend.

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

- Supabase helper files and Stripe placeholders remain in the repository for later phases, but they are not wired into the Phase 1 scaffold.
- Phase 2 should replace the cookie-based auth placeholder with real auth, data access, schema, and billing logic.
