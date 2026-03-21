"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSuperUserContext, requireAdmin, requireUser } from "@/lib/auth";
import { getInviteBillingState, updateBillingEnabled } from "@/lib/billing";
import { createWorkspaceForCurrentUser, getCurrentOrganization } from "@/lib/data";
import { getAppUrl } from "@/lib/env";

function textValue(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

function requiredTextValue(value: FormDataEntryValue | null, fieldName: string) {
  const normalized = textValue(value);

  if (!normalized) {
    throw new Error(`${fieldName} is required.`);
  }

  return normalized;
}

function roleLabel(role: string) {
  return role === "owner" ? "Admin" : role.charAt(0).toUpperCase() + role.slice(1);
}

function teamPath(message?: string, inviteUrl?: string) {
  const params = new URLSearchParams();
  if (message) params.set("message", message);
  if (inviteUrl) params.set("invite", inviteUrl);
  const query = params.toString();
  return query ? `/team?${query}` : "/team";
}

async function getScopedMember(memberId: string) {
  const { supabase, organization, userId } = await requireAdmin();
  const { data, error } = await supabase
    .from("organization_members")
    .select("id, organization_id, user_id, role")
    .eq("organization_id", organization.id)
    .eq("id", memberId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data?.id) {
    throw new Error("Member not found or not accessible.");
  }

  return {
    supabase,
    organizationId: organization.id,
    currentUserId: userId,
    member: data as { id: string; organization_id: string; user_id: string; role: "owner" | "admin" | "member" },
  };
}

async function assertAnotherAdminExists(
  supabase: Awaited<ReturnType<typeof getCurrentOrganization>>["supabase"],
  organizationId: string,
) {
  const { count, error } = await supabase
    .from("organization_members")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .in("role", ["owner", "admin"]);

  if (error) {
    throw error;
  }

  if ((count ?? 0) <= 1) {
    throw new Error("At least one admin must remain in the organization.");
  }
}

export async function createInviteAction(formData: FormData) {
  const { supabase, organization, userId } = await requireAdmin();
  const email = textValue(formData.get("email"))?.toLowerCase() ?? null;
  const role = requiredTextValue(formData.get("role"), "Role");
  const billingState = await getInviteBillingState();

  if (role !== "admin" && role !== "member") {
    throw new Error("Invite role must be admin or member.");
  }

  if (billingState.isAtFreeMemberLimit) {
    redirect(
      teamPath(
        `Billing is enabled and the free plan is limited to ${billingState.memberLimit} members. Upgrade this workspace before inviting more teammates.`,
      ),
    );
  }

  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();

  const { error } = await supabase.from("organization_invites").insert({
    organization_id: organization.id,
    email,
    role,
    token,
    invited_by: userId,
    expires_at: expiresAt,
  });

  if (error) {
    throw error;
  }

  const inviteUrl = `${getAppUrl()}/invite?token=${encodeURIComponent(token)}`;
  revalidatePath("/team");
  redirect(teamPath(`${roleLabel(role)} invite created.`, inviteUrl));
}

export async function acceptInviteAction(formData: FormData) {
  const { supabase } = await requireUser();
  const token = requiredTextValue(formData.get("token"), "Invite token");

  const { error } = await supabase.rpc("accept_organization_invite", {
    invite_token: token,
  });

  if (error) {
    redirect(`/invite?token=${encodeURIComponent(token)}&message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/team");
  redirect("/dashboard");
}

export async function updateMemberRoleAction(formData: FormData) {
  const memberId = requiredTextValue(formData.get("member_id"), "Member");
  const nextRole = requiredTextValue(formData.get("role"), "Role");

  if (nextRole !== "admin" && nextRole !== "member") {
    throw new Error("Member role must be admin or member.");
  }

  const { supabase, organizationId, currentUserId, member } = await getScopedMember(memberId);

  if (member.user_id === currentUserId) {
    redirect(teamPath("You cannot change your own membership role from the Team page."));
  }

  if (member.role === "owner") {
    redirect(teamPath("Owner access is fixed for the bootstrap admin in this MVP."));
  }

  if (member.role !== "member" && nextRole === "member") {
    await assertAnotherAdminExists(supabase, organizationId);
  }

  const { data, error } = await supabase
    .from("organization_members")
    .update({ role: nextRole })
    .eq("organization_id", organizationId)
    .eq("id", member.id)
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data?.id) {
    throw new Error("Member not found or not accessible.");
  }

  revalidatePath("/team");
  redirect(teamPath("Member role updated."));
}

export async function removeMemberAction(formData: FormData) {
  const memberId = requiredTextValue(formData.get("member_id"), "Member");
  const { supabase, organizationId, currentUserId, member } = await getScopedMember(memberId);

  if (member.user_id === currentUserId) {
    redirect(teamPath("You cannot remove yourself from the organization in this MVP."));
  }

  if (member.role !== "member") {
    await assertAnotherAdminExists(supabase, organizationId);
  }

  const { data, error } = await supabase
    .from("organization_members")
    .delete()
    .eq("organization_id", organizationId)
    .eq("id", member.id)
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data?.id) {
    throw new Error("Member not found or already removed.");
  }

  revalidatePath("/team");
  redirect(teamPath("Member removed."));
}

export async function createWorkspaceAction(formData: FormData) {
  const workspaceName = textValue(formData.get("name")) ?? undefined;
  await createWorkspaceForCurrentUser(workspaceName);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function goToInviteAction(formData: FormData) {
  const rawInvite = requiredTextValue(formData.get("invite"), "Invite link");

  try {
    const parsed = new URL(rawInvite);
    const token = parsed.searchParams.get("token");

    if (token) {
      redirect(`/invite?token=${encodeURIComponent(token)}`);
    }
  } catch {
    // Continue and treat the input as a plain token.
  }

  redirect(`/invite?token=${encodeURIComponent(rawInvite)}`);
}

export async function toggleBillingEnabledAction(formData: FormData) {
  const { isSuperUser } = await getSuperUserContext();

  if (!isSuperUser) {
    redirect("/settings");
  }

  const nextValue = requiredTextValue(formData.get("billing_enabled"), "Billing state") === "true";
  await updateBillingEnabled(nextValue);
  revalidatePath("/settings");
  revalidatePath("/team");
  redirect("/settings");
}

export async function upgradeOrganizationPlanAction() {
  const { supabase, organization } = await requireAdmin();

  if (organization.plan === "pro") {
    redirect("/team");
  }

  const { data, error } = await supabase
    .from("organizations")
    .update({ plan: "pro" })
    .eq("id", organization.id)
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data?.id) {
    throw new Error("Organization not found or not accessible.");
  }

  revalidatePath("/team");
  revalidatePath("/settings");
  redirect("/team");
}
