import { Topbar } from "@/components/layout/topbar";
import { Badge, ButtonLink, Card } from "@/components/ui";
import { getSettingsData } from "@/lib/data";
import { formatDateTime } from "@/lib/utils";

function displayRole(role: string) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function statusTone(value: boolean): "success" | "warning" {
  return value ? "success" : "warning";
}

function displayValue(value: string | null | undefined, fallback = "Not available") {
  return value || fallback;
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-ink">{value}</p>
    </div>
  );
}

export default async function SettingsPage() {
  const settings = await getSettingsData();

  return (
    <div className="space-y-6">
      <Topbar
        title="Settings"
        subtitle="Review account, workspace, and deployment details for the current organization."
      />

      <Card className="space-y-6 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-brand-700">Account Info</p>
            <h1 className="mt-2 font-serif text-4xl font-semibold text-ink">Your Account</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-600">
              This section is currently read-only. It reflects the authenticated Supabase user tied to
              the current workspace.
            </p>
          </div>
          <ButtonLink href="/dashboard" variant="ghost">
            Back to Dashboard
          </ButtonLink>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <DetailItem label="Name" value={displayValue(settings.user.fullName, "No profile name set")} />
          <DetailItem label="Email" value={displayValue(settings.user.email)} />
          <DetailItem label="Role" value={displayRole(settings.membership.role)} />
          <DetailItem label="Joined Workspace" value={formatDateTime(settings.membership.joinedAt)} />
        </div>

        <div className="rounded-[1.5rem] bg-sand/70 p-4 text-sm text-slate-700">
          <p>User ID</p>
          <p className="mt-2 break-all font-mono text-xs text-slate-600">{settings.user.id}</p>
        </div>
      </Card>

      <Card className="space-y-6 p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-brand-700">Workspace Info</p>
          <h2 className="mt-2 font-serif text-3xl font-semibold text-ink">{settings.organization.name}</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Workspace details are read-only for now. Organization editing and member management can be
            added later without changing the current route structure.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <DetailItem label="Workspace Name" value={settings.organization.name} />
          <DetailItem label="Workspace Slug" value={settings.organization.slug} />
          <DetailItem label="Member Role" value={displayRole(settings.membership.role)} />
          <DetailItem label="Projects" value={String(settings.workspaceSummary.projectCount)} />
        </div>
      </Card>

      <Card className="space-y-6 p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-brand-700">Deployment / Setup Status</p>
          <h2 className="mt-2 font-serif text-3xl font-semibold text-ink">Runtime Configuration</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            These checks are read-only and help confirm the current deployment has the minimum required
            setup for the features already shipped.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Badge tone={statusTone(Boolean(settings.deployment.appUrl))}>
            {settings.deployment.appUrl ? "App URL configured" : "App URL missing"}
          </Badge>
          <Badge tone={statusTone(settings.deployment.supabaseConfigured)}>
            {settings.deployment.supabaseConfigured ? "Supabase client env configured" : "Supabase env missing"}
          </Badge>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <DetailItem label="Public App URL" value={displayValue(settings.deployment.appUrl)} />
          <DetailItem label="Last Sign-In" value={formatDateTime(settings.user.lastSignInAt)} />
        </div>

        <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-sand/65 p-5 text-sm text-slate-700">
          Billing and Stripe remain intentionally deferred. This page only reflects the current account,
          workspace, and deployment state for the features already active in production.
        </div>
      </Card>
    </div>
  );
}
