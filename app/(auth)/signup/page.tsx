import Link from "next/link";
import { authAction } from "@/lib/actions/auth";
import { APP_NAME } from "@/lib/config";
import { Button, Card, Field, Input } from "@/components/ui";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="grid w-full max-w-5xl gap-8 md:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[2.5rem] bg-ink p-8 text-white shadow-panel md:p-12">
          <p className="text-sm uppercase tracking-[0.25em] text-brand-200">KeMAT FieldFlow</p>
          <h1 className="mt-6 max-w-xl font-serif text-5xl font-semibold leading-tight">
            Stand up the workspace now. Wire in real authentication in Phase 2.
          </h1>
          <p className="mt-6 max-w-lg text-sm text-slate-300">
            This Phase 1 scaffold includes protected routes, navigation, and placeholder pages so the product shell is ready for backend integration.
          </p>
        </section>
        <Card className="self-center p-8">
          <h2 className="font-serif text-3xl font-semibold">{APP_NAME}</h2>
          <p className="mt-2 text-sm text-slate-600">Create a placeholder account to enter the scaffold.</p>
          <form action={authAction} className="mt-6 space-y-4">
            <input type="hidden" name="mode" value="signup" />
            <Field label="Full name">
              <Input name="name" type="text" placeholder="Alex Contractor" required />
            </Field>
            <Field label="Email">
              <Input name="email" type="email" placeholder="you@company.com" required />
            </Field>
            <Field label="Password">
              <Input name="password" type="password" placeholder="Choose a password" required />
            </Field>
            <Button type="submit" className="w-full">
              Create account
            </Button>
          </form>
          <p className="mt-4 text-sm text-slate-600">
            Already have access?{" "}
            <Link href="/login" className="font-medium text-brand-700">
              Sign in
            </Link>
          </p>
        </Card>
      </div>
    </main>
  );
}
