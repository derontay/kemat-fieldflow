import { redirect } from "next/navigation";
import { acceptInviteAction } from "@/lib/actions/org";
import { createClient } from "@/lib/supabase/server";
import { APP_NAME } from "@/lib/config";
import { Badge, Button, Card } from "@/components/ui";
import { getOrganizationInvite } from "@/lib/data";
import { formatDateTime } from "@/lib/utils";

function displayRole(role: string) {
  return role === "admin" ? "Admin" : "Member";
}

export default async function InvitePage({
  searchParams,
}: {
  searchParams?: Promise<{ token?: string; message?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const token = params.token?.trim() ?? "";

  if (!token) {
    redirect("/login?message=Invite%20link%20is%20missing.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const next = `/invite?token=${encodeURIComponent(token)}`;

  if (!user) {
    redirect(
      `/login?message=${encodeURIComponent("Sign in to review your workspace invite.")}&next=${encodeURIComponent(next)}`,
    );
  }

  const invite = await getOrganizationInvite(token);

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-2xl space-y-6 p-8">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-brand-700">{APP_NAME}</p>
          <h1 className="mt-4 font-serif text-4xl font-semibold text-ink">Workspace Invite</h1>
          <p className="mt-3 text-sm text-slate-600">
            Review the invite and join the workspace with your current authenticated account.
          </p>
        </div>

        {params.message ? (
          <div className="rounded-2xl bg-brand-50 px-4 py-3 text-sm text-brand-700">{params.message}</div>
        ) : null}

        {!invite ? (
          <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-sand/65 p-6 text-sm text-slate-700">
            This invite could not be found. It may be invalid or no longer available.
          </div>
        ) : (
          <>
            <div className="grid gap-4 rounded-[1.75rem] border border-slate-200 bg-white/80 p-5 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Organization</p>
                <p className="mt-2 text-2xl font-semibold text-ink">{invite.organization_name}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Role</p>
                <div className="mt-2">
                  <Badge tone={invite.role === "admin" ? "warning" : "default"}>{displayRole(invite.role)}</Badge>
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Invited Email</p>
                <p className="mt-2 text-sm text-ink">{invite.email || "Any authenticated account"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Invited By</p>
                <p className="mt-2 text-sm text-ink">{invite.inviter_email || "Workspace admin"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Expires</p>
                <p className="mt-2 text-sm text-ink">{formatDateTime(invite.expires_at)}</p>
              </div>
            </div>

            <form action={acceptInviteAction}>
              <input type="hidden" name="token" value={token} />
              <Button type="submit">Join Workspace</Button>
            </form>
          </>
        )}
      </Card>
    </main>
  );
}
