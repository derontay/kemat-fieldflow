import { ConfirmButton } from "@/components/confirm-button";
import { Topbar } from "@/components/layout/topbar";
import { Badge, Button, Card, EmptyState, Field, Input, Select } from "@/components/ui";
import {
  createInviteAction,
  upgradeOrganizationPlanAction,
  removeMemberAction,
  updateMemberRoleAction,
} from "@/lib/actions/org";
import { getTeamData } from "@/lib/data";
import { formatDateTime } from "@/lib/utils";

function displayRole(role: string) {
  return role === "owner" ? "Owner" : role.charAt(0).toUpperCase() + role.slice(1);
}

function roleTone(role: string): "warning" | "default" {
  return role === "owner" || role === "admin" ? "warning" : "default";
}

export default async function TeamPage({
  searchParams,
}: {
  searchParams?: Promise<{ invite?: string; message?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const team = await getTeamData();

  return (
    <div className="space-y-6">
      <Topbar
        title="Team"
        subtitle="Manage workspace membership and share invite links without changing the current route structure."
      />

      {params.message ? <Card className="p-4 text-sm text-brand-700">{params.message}</Card> : null}

      {params.invite ? (
        <Card className="space-y-4 p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-brand-700">Latest Invite Link</p>
            <h2 className="mt-2 font-serif text-2xl font-semibold text-ink">Share this invite</h2>
            <p className="mt-2 text-sm text-slate-600">
              Send this link to the invited teammate. It expires automatically after seven days.
            </p>
          </div>
          <div className="rounded-[1.5rem] bg-sand/70 p-4">
            <p className="break-all font-mono text-xs text-slate-700">{params.invite}</p>
          </div>
        </Card>
      ) : null}

      <Card className="space-y-6 p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-brand-700">Workspace Members</p>
          <h1 className="mt-2 font-serif text-3xl font-semibold text-ink">{team.organization.name}</h1>
          <p className="mt-2 text-sm text-slate-600">
            Members can view the workspace. Admins can invite teammates and manage roles.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Badge tone="default">
            {team.billing.memberCount} member{team.billing.memberCount === 1 ? "" : "s"}
          </Badge>
          <Badge tone={team.billing.plan === "pro" ? "success" : "default"}>
            {team.billing.plan === "pro"
              ? "Pro plan - Unlimited members"
              : `Free plan - ${team.billing.memberLimit} member limit`}
          </Badge>
          {team.billing.billingEnabled ? (
            <Badge tone={team.billing.isAtFreeMemberLimit ? "warning" : "success"}>
              Billing {team.billing.isAtFreeMemberLimit ? "limit reached" : "active"}
            </Badge>
          ) : (
            <Badge tone="success">Billing off</Badge>
          )}
        </div>

        {team.members.length <= 1 ? (
          <EmptyState
            title="Invite your team to get started"
            description="Add admins or members so this workspace becomes a shared operational view instead of a solo shell."
          />
        ) : null}

        {team.members.length === 0 ? (
          <EmptyState
            title="No members yet"
            description="The workspace has not loaded any organization members yet."
          />
        ) : (
          <div className="space-y-3">
            {team.members.map((member) => {
              const canManageThisMember =
                team.canManageMembers && member.role !== "owner" && member.user_id !== team.currentUserId;

              return (
                <div key={member.id} className="rounded-[1.5rem] border border-slate-200 bg-white/80 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-medium text-ink">
                        {member.full_name || member.email || "Unknown teammate"}
                        {member.user_id === team.currentUserId ? " (You)" : ""}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">{member.email || "Email unavailable"}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        Joined {formatDateTime(member.created_at)}
                      </p>
                    </div>
                    <Badge tone={roleTone(member.role)}>{displayRole(member.role)}</Badge>
                  </div>

                  {canManageThisMember ? (
                    <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 md:flex-row md:items-center md:justify-between">
                      <form action={updateMemberRoleAction} className="flex flex-col gap-3 md:flex-row md:items-center">
                        <input type="hidden" name="member_id" value={member.id} />
                        <Select name="role" defaultValue={member.role} className="bg-white md:w-auto">
                          <option value="admin">Admin</option>
                          <option value="member">Member</option>
                        </Select>
                        <Button type="submit" variant="ghost">
                          Update Role
                        </Button>
                      </form>

                      <form action={removeMemberAction}>
                        <input type="hidden" name="member_id" value={member.id} />
                        <ConfirmButton message="Remove this member from the workspace?" variant="ghost">
                          Remove
                        </ConfirmButton>
                      </form>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {team.canManageMembers ? (
        <Card className="space-y-6 p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-brand-700">Invite Teammate</p>
            <h2 className="mt-2 font-serif text-3xl font-semibold text-ink">Create Invite</h2>
            <p className="mt-2 text-sm text-slate-600">
              Create a token-based invite link for a new admin or member. Email is optional if you want a
              shareable team link.
            </p>
          </div>

          {team.organization.plan === "free" ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4">
              <div>
                <p className="text-sm font-medium text-ink">Upgrade this workspace to Pro</p>
                <p className="mt-1 text-sm text-slate-600">
                  Pro removes the free-plan member cap and keeps invites available even when billing enforcement is on.
                </p>
              </div>
              <form action={upgradeOrganizationPlanAction}>
                <Button type="submit" variant="secondary">
                  Upgrade to Pro
                </Button>
              </form>
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800">
              This workspace is on Pro. Member invites stay available with unlimited seats.
            </div>
          )}

          <form action={createInviteAction} className="grid gap-4 md:grid-cols-[1.4fr_0.6fr_auto]">
            <Field label="Email (optional)">
              <Input name="email" type="email" placeholder="teammate@company.com" />
            </Field>
            <Field label="Role">
              <Select name="role" defaultValue="member">
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </Select>
            </Field>
            <div className="flex items-end">
              <Button
                type="submit"
                variant="secondary"
                className="w-full md:w-auto"
                disabled={team.billing.isAtFreeMemberLimit}
              >
                Create Invite
              </Button>
            </div>
          </form>

          {team.billing.isAtFreeMemberLimit ? (
            <div className="rounded-[1.5rem] border border-dashed border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
              Billing is enabled and this free workspace is already at its {team.billing.memberLimit}-member limit.
              Upgrade the organization to keep inviting teammates.
            </div>
          ) : team.billing.billingEnabled ? (
            <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-sand/65 p-4 text-sm text-slate-700">
              Billing is on. This workspace is on the {team.billing.plan === "pro" ? "Pro" : "Free"} plan with{" "}
              {team.billing.memberCount} member{team.billing.memberCount === 1 ? "" : "s"}.
              {!team.billing.hasUnlimitedMembers ? (
                <span className="mt-2 block">
                  Free workspaces can invite up to {team.billing.memberLimit} members while billing enforcement is active.
                </span>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Pending Invites</p>
            {team.invites.length === 0 ? (
              <EmptyState
                title="No pending invites"
                description="Invite links you create will appear here until they are accepted or expire."
              />
            ) : (
              team.invites.map((invite) => (
                <div key={invite.id} className="rounded-[1.5rem] border border-slate-200 bg-white/80 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-medium text-ink">{invite.email || "Shareable team invite"}</p>
                      <p className="mt-1 text-sm text-slate-600">Expires {formatDateTime(invite.expires_at)}</p>
                    </div>
                    <Badge tone={roleTone(invite.role)}>{displayRole(invite.role)}</Badge>
                  </div>
                  <div className="mt-4 rounded-[1rem] bg-sand/70 p-3">
                    <p className="break-all font-mono text-xs text-slate-700">{`/invite?token=${invite.token}`}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      ) : (
        <Card className="p-6 text-sm text-slate-600">
          Your current membership can view the team list, but only admins can create invites and manage roles.
        </Card>
      )}
    </div>
  );
}
