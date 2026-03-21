import { getSuperUserContext } from "@/lib/auth";
import { getCurrentOrganization } from "@/lib/data";

export const FREE_PLAN_MEMBER_LIMIT = 3;

export async function getBillingEnabled() {
  const { supabase } = await getSuperUserContext();
  const { data, error } = await supabase
    .from("app_settings")
    .select("billing_enabled")
    .eq("id", true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data?.billing_enabled);
}

export async function updateBillingEnabled(nextValue: boolean) {
  const { supabase } = await getSuperUserContext();
  const { data, error } = await supabase
    .from("app_settings")
    .update({ billing_enabled: nextValue })
    .eq("id", true)
    .select("billing_enabled")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data?.billing_enabled);
}

export async function getBillingGate() {
  const [{ currentUserEmail, isSuperUser }, billingEnabled] = await Promise.all([
    getSuperUserContext(),
    getBillingEnabled(),
  ]);

  return {
    currentUserEmail,
    isSuperUser,
    billingEnabled,
    shouldEnforceBilling: billingEnabled && !isSuperUser,
  };
}

export async function getOrganizationPlanSummary() {
  const { supabase, organization } = await getCurrentOrganization();
  const { count, error } = await supabase
    .from("organization_members")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organization.id);

  if (error) {
    throw error;
  }

  return {
    plan: organization.plan,
    memberCount: count ?? 0,
    memberLimit: FREE_PLAN_MEMBER_LIMIT,
  };
}

export async function getInviteBillingState() {
  const [gate, planSummary] = await Promise.all([getBillingGate(), getOrganizationPlanSummary()]);
  const hasUnlimitedMembers = planSummary.plan === "pro";
  const isAtFreeMemberLimit =
    gate.shouldEnforceBilling &&
    !hasUnlimitedMembers &&
    planSummary.memberCount >= planSummary.memberLimit;

  return {
    ...gate,
    ...planSummary,
    hasUnlimitedMembers,
    isAtFreeMemberLimit,
  };
}
