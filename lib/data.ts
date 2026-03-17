import { cache } from "react";
import { notFound } from "next/navigation";
import { addDays } from "date-fns";
import { requireUser } from "@/lib/auth";
import { type Expense, type FieldUpdate, type Organization, type Project, type Task, type Vendor } from "@/types/database";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function getDefaultOrganizationName(user: Awaited<ReturnType<typeof requireUser>>["user"]) {
  const metadata = user.user_metadata as Record<string, unknown> | undefined;
  const fullName =
    typeof metadata?.full_name === "string"
      ? metadata.full_name
      : typeof metadata?.name === "string"
        ? metadata.name
        : null;
  const emailPrefix = user.email?.split("@")[0]?.replace(/[._-]+/g, " ") ?? "My";
  const baseName = fullName || emailPrefix;
  const cleaned = baseName
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  return cleaned ? `${cleaned} Workspace` : "My Workspace";
}

async function findCurrentOrganization(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  userId: string,
) {
  const { data, error } = await supabase
    .from("organization_members")
    .select("organization:organizations(id,name,slug)")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const organization = Array.isArray(data?.organization) ? data.organization[0] : data?.organization;
  return (organization as Organization | undefined) ?? null;
}

async function bootstrapOrganizationForUser(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  user: Awaited<ReturnType<typeof requireUser>>["user"],
) {
  const name = getDefaultOrganizationName(user);
  const baseSlug = slugify(name) || "workspace";
  const slug = `${baseSlug}-${user.id.slice(0, 8)}`;

  const { error } = await supabase.from("organizations").insert({
    name,
    slug,
    created_by: user.id,
  });

  if (error && error.code !== "23505") {
    throw error;
  }

  const organization = await findCurrentOrganization(supabase, user.id);

  if (!organization) {
    throw new Error("Unable to bootstrap organization membership for this user.");
  }

  return organization;
}

export const getCurrentOrganization = cache(async (): Promise<{
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"];
  userId: string;
  organization: Organization;
}> => {
  const { supabase, user } = await requireUser();
  let organization = await findCurrentOrganization(supabase, user.id);

  if (!organization) {
    organization = await bootstrapOrganizationForUser(supabase, user);
  }

  return {
    supabase,
    userId: user.id,
    organization,
  };
});

export async function getDashboardData() {
  const { supabase, organization } = await getCurrentOrganization();

  const today = new Date().toISOString().slice(0, 10);
  const upcomingDeadline = addDays(new Date(), 14).toISOString().slice(0, 10);

  const [{ data: projects }, { data: tasks }, { data: updates }, { data: expenses }] =
    await Promise.all([
      supabase
        .from("projects")
        .select("*")
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("tasks")
        .select("*")
        .eq("organization_id", organization.id)
        .neq("status", "done"),
      supabase
        .from("field_updates")
        .select("*, project:projects(name)")
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("expenses")
        .select("project_id, amount")
        .eq("organization_id", organization.id),
    ]);

  const expenseTotals = new Map<string, number>();
  (expenses ?? []).forEach((expense) => {
    expenseTotals.set(expense.project_id, (expenseTotals.get(expense.project_id) ?? 0) + Number(expense.amount));
  });

  const enrichedProjects = (projects ?? []).map((project) => {
    const totalExpenses = expenseTotals.get(project.id) ?? Number(project.actual_spend ?? 0);
    return {
      ...project,
      total_expenses: totalExpenses,
      variance: Number(project.planned_budget) - totalExpenses,
    };
  });

  return {
    organization,
    metrics: {
      activeProjects: enrichedProjects.filter((project) => project.status === "active").length,
      overdueTasks: (tasks ?? []).filter((task) => task.due_date && task.due_date < today).length,
      overBudgetProjects: enrichedProjects.filter(
        (project) => (project.total_expenses ?? 0) > Number(project.planned_budget),
      ).length,
    },
    alerts: {
      overdueTasks: (tasks ?? []).filter((task) => task.due_date && task.due_date < today).slice(0, 5),
      deadlineProjects: enrichedProjects.filter(
        (project) =>
          project.target_completion_date &&
          project.target_completion_date >= today &&
          project.target_completion_date <= upcomingDeadline,
      ),
      overBudgetProjects: enrichedProjects.filter(
        (project) => (project.total_expenses ?? 0) > Number(project.planned_budget),
      ),
    },
    recentUpdates: updates ?? [],
    projects: enrichedProjects,
  };
}

export async function getProjects() {
  const { supabase, organization } = await getCurrentOrganization();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("organization_id", organization.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as Project[];
}

export async function getProjectDetail(projectId: string) {
  const { supabase, organization } = await getCurrentOrganization();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("organization_id", organization.id)
    .eq("id", projectId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) notFound();

  return data as Project;
}

export async function getTasks() {
  const { supabase, organization } = await getCurrentOrganization();
  const { data } = await supabase
    .from("tasks")
    .select("*, project:projects(name)")
    .eq("organization_id", organization.id)
    .order("due_date", { ascending: true });
  return data ?? [];
}

export async function getExpenses() {
  const { supabase, organization } = await getCurrentOrganization();
  const { data } = await supabase
    .from("expenses")
    .select("*, project:projects(name), vendor:vendors(name)")
    .eq("organization_id", organization.id)
    .order("expense_date", { ascending: false });
  return data ?? [];
}

export async function getVendors() {
  const { supabase, organization } = await getCurrentOrganization();
  const { data } = await supabase
    .from("vendors")
    .select("*")
    .eq("organization_id", organization.id)
    .order("name");
  return data ?? [];
}

export async function getBillingState() {
  const { supabase, organization } = await getCurrentOrganization();
  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("organization_id", organization.id)
    .maybeSingle();
  return data;
}
