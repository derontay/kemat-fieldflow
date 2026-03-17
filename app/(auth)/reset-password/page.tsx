import Link from "next/link";
import { authAction } from "@/lib/actions/auth";
import { APP_NAME } from "@/lib/config";
import { Button, Card, Field, Input } from "@/components/ui";

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-xl">
        <Card className="p-8">
          <p className="text-sm uppercase tracking-[0.25em] text-brand-700">Phase 1 Access</p>
          <h1 className="mt-3 font-serif text-3xl font-semibold text-ink">{APP_NAME}</h1>
          <p className="mt-2 text-sm text-slate-600">
            This reset flow is a placeholder. Submitting it will return you to the scaffold login flow.
          </p>
          <form action={authAction} className="mt-6 space-y-4">
            <input type="hidden" name="mode" value="reset-password" />
            <Field label="Email">
              <Input name="email" type="email" placeholder="you@company.com" required />
            </Field>
            <Button type="submit" className="w-full">
              Send reset link
            </Button>
          </form>
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
