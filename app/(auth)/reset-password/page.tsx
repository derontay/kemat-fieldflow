import Link from "next/link";
import { authAction, updatePasswordAction } from "@/lib/actions/auth";
import { APP_NAME } from "@/lib/config";
import { Button, Card, Field, Input } from "@/components/ui";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; message?: string }>;
}) {
  const params = await searchParams;
  const isUpdateMode = params.mode === "update";

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-xl">
        <Card className="p-8">
          <p className="text-sm uppercase tracking-[0.25em] text-brand-700">Account Recovery</p>
          <h1 className="mt-3 font-serif text-3xl font-semibold text-ink">{APP_NAME}</h1>
          <p className="mt-2 text-sm text-slate-600">
            {isUpdateMode
              ? "Choose a new password for your account."
              : "Request a secure password reset link from Supabase Auth."}
          </p>
          {params.message ? (
            <p className="mt-4 rounded-2xl bg-brand-50 px-4 py-3 text-sm text-brand-700">{params.message}</p>
          ) : null}
          {isUpdateMode ? (
            <form action={updatePasswordAction} className="mt-6 space-y-4">
              <Field label="New password">
                <Input name="password" type="password" placeholder="Enter a new password" required />
              </Field>
              <Field label="Confirm password">
                <Input name="confirmPassword" type="password" placeholder="Confirm your new password" required />
              </Field>
              <Button type="submit" className="w-full">
                Update password
              </Button>
            </form>
          ) : (
            <form action={authAction} className="mt-6 space-y-4">
              <input type="hidden" name="mode" value="reset-password" />
              <Field label="Email">
                <Input name="email" type="email" placeholder="you@company.com" required />
              </Field>
              <Button type="submit" className="w-full">
                Send reset link
              </Button>
            </form>
          )}
          <p className="mt-4 text-sm text-slate-600">
            Back to{" "}
            <Link href="/login" className="font-medium text-brand-700">
              sign in
            </Link>
          </p>
        </Card>
      </div>
    </main>
  );
}
