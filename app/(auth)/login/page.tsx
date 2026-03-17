import Link from "next/link";
import { authAction } from "@/lib/actions/auth";
import { APP_NAME } from "@/lib/config";
import { Button, Card, Field, Input } from "@/components/ui";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
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
            Sign in with your Supabase account to access the protected workspace shell.
          </p>
        </section>
        <Card className="self-center p-8">
          <h2 className="font-serif text-3xl font-semibold">{APP_NAME}</h2>
          <p className="mt-2 text-sm text-slate-600">Sign in to access the protected workspace.</p>
          {params.message ? (
            <p className="mt-4 rounded-2xl bg-brand-50 px-4 py-3 text-sm text-brand-700">{params.message}</p>
          ) : null}
          <form action={authAction} className="mt-6 space-y-4">
            <input type="hidden" name="mode" value="login" />
            <Field label="Email">
              <Input name="email" type="email" placeholder="you@company.com" required />
            </Field>
            <Field label="Password">
              <Input name="password" type="password" placeholder="Enter your password" required />
            </Field>
            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </form>
          <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
            <Link href="/signup" className="font-medium text-brand-700">
              Create account
            </Link>
            <Link href="/reset-password" className="font-medium text-brand-700">
              Forgot password?
            </Link>
          </div>
        </Card>
      </div>
    </main>
  );
}
