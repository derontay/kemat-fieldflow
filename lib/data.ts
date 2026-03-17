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
  const { supabase, organization, userId } = await getCurrentOrganization();
  const today = new Date().toISOString().slice(0, 10);

  const [
    { count: totalProjects, error: projectsError },
    { count: activeProjects, error: activeProjectsError },
    { data: openTasks, error: openTasksError },
    { data: expenses, error: expensesError },
    { data: recentUpdates, error: updatesError },
  ] = await Promise.all([
    supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organization.id),
    supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organization.id)
      .eq("status", "active"),
    supabase
      .from("tasks")
      .select("id, due_date, status, title, project_id, project:projects(name)")
      .eq("organization_id", organization.id)
      .neq("status", "done")
      .order("due_date", { ascending: true }),
    supabase
      .from("expenses")
      .select("amount")
      .eq("organization_id", organization.id),
    supabase
      .from("field_updates")
      .select("id, title, description, created_at, created_by, project_id, project:projects(name)")
      .eq("organization_id", organization.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  if (projectsError) throw projectsError;
  if (activeProjectsError) throw activeProjectsError;
  if (openTasksError) throw openTasksError;
  if (expensesError) throw expensesError;
  if (updatesError) throw updatesError;

  const openTaskRows = openTasks ?? [];
  const totalExpenses = (expenses ?? []).reduce((sum, item) => sum + Number(item.amount), 0);

  return {
    organization,
    currentUserId: userId,
    metrics: {
      totalProjects: totalProjects ?? 0,
      activeProjects: activeProjects ?? 0,
      totalOpenTasks: openTaskRows.length,
      overdueTasks: openTaskRows.filter((task) => task.due_date && task.due_date < today).length,
      totalExpenses,
    },
    openTasks: openTaskRows,
    recentUpdates: recentUpdates ?? [],
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

export async function getProjectActivity(projectId: string) {
  const { supabase, organization, userId } = await getCurrentOrganization();
  const { data, error } = await supabase
    .from("field_updates")
    .select("id, project_id, organization_id, created_by, title, description, created_at")
    .eq("organization_id", organization.id)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return {
    currentUserId: userId,
    updates: (data ?? []) as FieldUpdate[],
  };
}

export async function getTasks() {
  const { supabase, organization } = await getCurrentOrganization();
  const { data, error } = await supabase
    .from("tasks")
    .select("*, project:projects(name)")
    .eq("organization_id", organization.id)
    .order("due_date", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getTaskDetail(taskId: string) {
  const { supabase, organization } = await getCurrentOrganization();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("organization_id", organization.id)
    .eq("id", taskId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) notFound();

  return data as Task;
}

export async function getExpenses() {
  const { supabase, organization } = await getCurrentOrganization();
  const { data, error } = await supabase
    .from("expenses")
    .select("*, project:projects(name), vendor:vendors(name)")
    .eq("organization_id", organization.id)
    .order("expense_date", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getExpenseDetail(expenseId: string) {
  const { supabase, organization } = await getCurrentOrganization();
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("organization_id", organization.id)
    .eq("id", expenseId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) notFound();

  return data as Expense;
}

export async function getVendors() {
  const { supabase, organization } = await getCurrentOrganization();
  const { data, error } = await supabase
    .from("vendors")
    .select("*")
    .eq("organization_id", organization.id)
    .order("name");

  if (error) {
    throw error;
  }

  return (data ?? []) as Vendor[];
}

export async function getVendorDetail(vendorId: string) {
  const { supabase, organization } = await getCurrentOrganization();
  const { data, error } = await supabase
    .from("vendors")
    .select("*")
    .eq("organization_id", organization.id)
    .eq("id", vendorId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) notFound();

  return data as Vendor;
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
