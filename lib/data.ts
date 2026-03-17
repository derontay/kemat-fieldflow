import { cache } from "react";
import { notFound } from "next/navigation";
import { addDays } from "date-fns";
import { requireUser } from "@/lib/auth";
import { type Expense, type FieldUpdate, type Organization, type Project, type Task, type Vendor } from "@/types/database";

type ProjectWithMetrics = Project & {
  total_expenses?: number | null;
  variance?: number | null;
};

export const getCurrentOrganization = cache(async (): Promise<{
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"];
  userId: string;
  organization: Organization;
}> => {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("organization_members")
    .select("organization:organizations(id,name,slug)")
    .eq("user_id", user.id)
    .single();

  if (error || !data?.organization) {
    throw new Error("No organization membership found for this user.");
  }

  return {
    supabase,
    userId: user.id,
    organization: data.organization as unknown as Organization,
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
  const [{ data: projects }, { data: expenses }] = await Promise.all([
    supabase
      .from("projects")
      .select("*")
      .eq("organization_id", organization.id)
      .order("created_at", { ascending: false }),
    supabase.from("expenses").select("project_id, amount").eq("organization_id", organization.id),
  ]);

  const expenseTotals = new Map<string, number>();
  (expenses ?? []).forEach((expense) => {
    expenseTotals.set(expense.project_id, (expenseTotals.get(expense.project_id) ?? 0) + Number(expense.amount));
  });

  return (projects ?? []).map((project) => {
    const totalExpenses = expenseTotals.get(project.id) ?? Number(project.actual_spend ?? 0);
    return {
      ...project,
      total_expenses: totalExpenses,
      variance: Number(project.planned_budget) - totalExpenses,
    } as ProjectWithMetrics;
  });
}

export async function getProjectDetail(projectId: string) {
  const { supabase, organization } = await getCurrentOrganization();
  const [
    { data: project },
    { data: tasks },
    { data: updates },
    { data: expenses },
    { data: vendors },
  ] = await Promise.all([
    supabase
      .from("projects")
      .select("*")
      .eq("organization_id", organization.id)
      .eq("id", projectId)
      .single(),
    supabase
      .from("tasks")
      .select("*")
      .eq("organization_id", organization.id)
      .eq("project_id", projectId)
      .order("due_date", { ascending: true }),
    supabase
      .from("field_updates")
      .select("*")
      .eq("organization_id", organization.id)
      .eq("project_id", projectId)
      .order("created_at", { ascending: false }),
    supabase
      .from("expenses")
      .select("*, vendor:vendors(name)")
      .eq("organization_id", organization.id)
      .eq("project_id", projectId)
      .order("expense_date", { ascending: false }),
    supabase
      .from("vendors")
      .select("*")
      .eq("organization_id", organization.id)
      .order("name"),
  ]);

  if (!project) notFound();

  const totalExpenses = (expenses ?? []).reduce((sum, item) => sum + Number(item.amount), 0);

  return {
    project: {
      ...project,
      total_expenses: totalExpenses,
      variance: Number(project.planned_budget) - totalExpenses,
    },
    tasks: (tasks ?? []) as Task[],
    updates: (updates ?? []) as FieldUpdate[],
    expenses: (expenses ?? []) as (Expense & { vendor?: { name: string } | null })[],
    vendors: (vendors ?? []) as Vendor[],
  };
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
