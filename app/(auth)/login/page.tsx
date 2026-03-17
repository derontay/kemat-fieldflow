import { loginAction } from "@/lib/actions/auth";
import { APP_NAME } from "@/lib/config";
import { Button, Card, Field, Input } from "@/components/ui";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="grid w-full max-w-5xl gap-8 md:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[2.5rem] bg-ink p-8 text-white shadow-panel md:p-12">
          <p className="text-sm uppercase tracking-[0.25em] text-brand-200">KeMAT FieldFlow</p>
          <h1 className="mt-6 max-w-xl font-serif text-5xl font-semibold leading-tight">
            Field-first project tracking for small builders and rehab teams.
          </h1>
          <p className="mt-6 max-w-lg text-sm text-slate-300">
            Manage projects, site updates, expenses, vendors, and budget risk from the office or on site.
          </p>
        </section>
        <Card className="self-center p-8">
          <h2 className="font-serif text-3xl font-semibold">{APP_NAME}</h2>
          <p className="mt-2 text-sm text-slate-600">Sign in with Supabase Auth or create an account.</p>
          {params.error ? (
            <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{params.error}</p>
          ) : null}
          <form action={loginAction} className="mt-6 space-y-4">
            <Field label="Email">
              <Input name="email" type="email" placeholder="you@company.com" required />
            </Field>
            <Field label="Password">
              <Input name="password" type="password" placeholder="Minimum 6 characters" required />
            </Field>
            <div className="flex gap-3">
              <Button type="submit" name="mode" value="login" className="flex-1">
                Sign in
              </Button>
              <Button type="submit" name="mode" value="signup" variant="secondary" className="flex-1">
                Create account
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </main>
  );
}
