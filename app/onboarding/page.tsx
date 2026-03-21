import { redirect } from "next/navigation";
import { Button, Card, Field, Input } from "@/components/ui";
import { createWorkspaceAction, goToInviteAction } from "@/lib/actions/org";
import { getOptionalCurrentOrganization } from "@/lib/data";

export default async function OnboardingPage() {
  const context = await getOptionalCurrentOrganization();

  if (context.organization) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="grid w-full max-w-5xl gap-8 md:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2.5rem] bg-ink p-8 text-white shadow-panel md:p-12">
          <p className="text-sm uppercase tracking-[0.25em] text-brand-200">Workspace Setup</p>
          <h1 className="mt-6 max-w-xl font-serif text-5xl font-semibold leading-tight">
            Create a workspace or join one with an invite.
          </h1>
          <p className="mt-6 max-w-lg text-sm text-slate-300">
            You&apos;re signed in, but you&apos;re not attached to a workspace yet. Choose one clear next step to
            get into Morning Ops.
          </p>
        </section>
        <div className="space-y-6">
          <Card className="space-y-5 p-8">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-brand-700">Step 1</p>
              <h2 className="mt-2 font-serif text-3xl font-semibold text-ink">Create Workspace</h2>
              <p className="mt-2 text-sm text-slate-600">
                Start a new workspace for your team. You can rename it later.
              </p>
            </div>
            <form action={createWorkspaceAction} className="space-y-4">
              <Field label="Workspace name (optional)">
                <Input name="name" placeholder="Acme Rehab Team" />
              </Field>
              <Button type="submit" className="w-full">
                Create Workspace
              </Button>
            </form>
          </Card>

          <Card className="space-y-5 p-8">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-brand-700">Step 2</p>
              <h2 className="mt-2 font-serif text-3xl font-semibold text-ink">Join with Invite Link</h2>
              <p className="mt-2 text-sm text-slate-600">
                Paste the full invite URL or just the token from your workspace admin.
              </p>
            </div>
            <form action={goToInviteAction} className="space-y-4">
              <Field label="Invite link or token">
                <Input name="invite" placeholder="https://.../invite?token=..." required />
              </Field>
              <Button type="submit" variant="secondary" className="w-full">
                Continue to Invite
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </main>
  );
}
