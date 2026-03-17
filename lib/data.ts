import { cache } from "react";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import {
  type Expense,
  type FieldUpdate,
  type Organization,
  type Project,
  type Task,
  type TaskTemplate,
  type TaskTemplateItem,
  type Vendor,
} from "@/types/database";

function startOfToday() {
  return new Date(new Date().toDateString());
}

function startOfTomorrow() {
  const today = startOfToday();
  return new Date(today.getTime() + 1000 * 60 * 60 * 24);
}

function isSameDay(value: string | null | undefined, dayStart: Date) {
  if (!value) return false;
  const nextDay = new Date(dayStart.getTime() + 1000 * 60 * 60 * 24);
  const date = new Date(value);
  return date >= dayStart && date < nextDay;
}

function daysSince(value: string | null | undefined) {
  if (!value) return Number.POSITIVE_INFINITY;
  const diff = Date.now() - new Date(value).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function calculateProjectHealth({
  plannedBudget,
  actualSpend,
  overdueTasks,
  lastUpdateAt,
}: {
  plannedBudget: number;
  actualSpend: number;
  overdueTasks: number;
  lastUpdateAt: string | null;
}) {
  const budgetVariance = actualSpend - plannedBudget;
  const overBudgetRatio = plannedBudget > 0 ? budgetVariance / plannedBudget : 0;
  const staleDays = daysSince(lastUpdateAt);

  if (overdueTasks > 3 || overBudgetRatio > 0.1) {
    return "Needs Attention" as const;
  }

  if (overdueTasks > 0 || staleDays > 3) {
    return "At Risk" as const;
  }

  return "On Track" as const;
}

type ProjectHealthRow = {
  id: string;
  name: string;
  address: string | null;
  status: string;
  startDate: string | null;
  targetCompletionDate: string | null;
  plannedBudget: number;
  createdAt: string;
  spend: number;
  overdueTasks: number;
  totalTasks: number;
  lastUpdateAt: string | null;
  healthStatus: "On Track" | "At Risk" | "Needs Attention";
};

type TaskCommandRow = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  status: "not_started" | "in_progress" | "blocked" | "done";
  projectId: string;
  assigneeId: string | null;
  createdAt: string;
  project?: { name: string } | { name: string }[] | null;
};

type ExpenseCommandRow = {
  id: string;
  projectId: string;
  vendorId: string | null;
  category: string;
  amount: number;
  expenseDate: string;
  notes: string | null;
  createdAt: string;
  project?: { name: string } | { name: string }[] | null;
  vendor?: { name: string } | { name: string }[] | null;
};

type VendorIntelligenceRow = {
  id: string;
  name: string;
  trade: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  totalLinkedExpenses: number;
  totalSpend: number;
  projectCount: number;
  lastExpenseDate: string | null;
};

function relationName(value?: { name: string } | { name: string }[] | null) {
  if (Array.isArray(value)) return value[0]?.name ?? null;
  return value?.name ?? null;
}

async function getProjectHealthRows(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  organizationId: string,
) {
  const today = startOfToday();
  const [{ data: projects, error: projectsError }, { data: tasks, error: tasksError }, { data: expenses, error: expensesError }, { data: updates, error: updatesError }] =
    await Promise.all([
      supabase
        .from("projects")
        .select("id, name, address, status, start_date, target_completion_date, planned_budget, created_at")
        .eq("organization_id", organizationId),
      supabase
        .from("tasks")
        .select("project_id, due_date, status")
        .eq("organization_id", organizationId),
      supabase
        .from("expenses")
        .select("amount, project_id")
        .eq("organization_id", organizationId),
      supabase
        .from("field_updates")
        .select("project_id, created_at")
        .eq("organization_id", organizationId),
    ]);

  if (projectsError) throw projectsError;
  if (tasksError) throw tasksError;
  if (expensesError) throw expensesError;
  if (updatesError) throw updatesError;

  const projectExpenseMap = new Map<string, number>();
  const taskStatsMap = new Map<string, { total: number; overdue: number }>();
  const updateMap = new Map<string, string | null>();

  for (const expense of (expenses ?? []) as Array<{ amount: number; project_id?: string }>) {
    if (!expense.project_id) continue;
    projectExpenseMap.set(
      expense.project_id,
      (projectExpenseMap.get(expense.project_id) ?? 0) + Number(expense.amount),
    );
  }

  for (const task of (tasks ?? []) as Array<{ project_id: string; due_date: string | null; status: string }>) {
    const current = taskStatsMap.get(task.project_id) ?? { total: 0, overdue: 0 };
    current.total += 1;
    if (task.status !== "done" && task.due_date && new Date(task.due_date) < today) {
      current.overdue += 1;
    }
    taskStatsMap.set(task.project_id, current);
  }

  for (const update of (updates ?? []) as Array<{ project_id: string; created_at: string }>) {
    const existing = updateMap.get(update.project_id);
    if (!existing || new Date(update.created_at) > new Date(existing)) {
      updateMap.set(update.project_id, update.created_at);
    }
  }

  return ((projects ?? []) as Array<{
    id: string;
    name: string;
    address: string | null;
    status: string;
    start_date: string | null;
    target_completion_date: string | null;
    planned_budget: number | null;
    created_at: string;
  }>).map((project) => {
    const plannedBudget = Number(project.planned_budget ?? 0);
    const spend = projectExpenseMap.get(project.id) ?? 0;
    const stats = taskStatsMap.get(project.id) ?? { total: 0, overdue: 0 };
    const lastUpdateAt = updateMap.get(project.id) ?? null;

    return {
      id: project.id,
      name: project.name,
      address: project.address,
      status: project.status,
      startDate: project.start_date,
      targetCompletionDate: project.target_completion_date,
      plannedBudget,
      createdAt: project.created_at,
      spend,
      overdueTasks: stats.overdue,
      totalTasks: stats.total,
      lastUpdateAt,
      healthStatus: calculateProjectHealth({
        plannedBudget,
        actualSpend: spend,
        overdueTasks: stats.overdue,
        lastUpdateAt,
      }),
    };
  });
}

async function getExpenseRows(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  organizationId: string,
) {
  const { data, error } = await supabase
    .from("expenses")
    .select("*, project:projects(name), vendor:vendors(name)")
    .eq("organization_id", organizationId);

  if (error) {
    throw error;
  }

  return (data ?? []) as Array<{
    id: string;
    project_id: string;
    vendor_id: string | null;
    category: string;
    amount: number;
    expense_date: string;
    notes: string | null;
    created_at: string;
    project?: { name: string } | { name: string }[] | null;
    vendor?: { name: string } | { name: string }[] | null;
  }>;
}

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
  const today = startOfToday();
  const tomorrow = startOfTomorrow();

  const [
    { count: totalProjects, error: projectsError },
    { count: activeProjects, error: activeProjectsError },
    { data: openTasks, error: openTasksError },
    { data: expenses, error: expensesError },
    { data: recentUpdates, error: updatesError },
    projectHealthRows,
    expenseRows,
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
      .select("amount, project_id")
      .eq("organization_id", organization.id),
    supabase
      .from("field_updates")
      .select("id, title, description, created_at, created_by, project_id, project:projects(name)")
      .eq("organization_id", organization.id)
      .order("created_at", { ascending: false })
      .limit(5),
    getProjectHealthRows(supabase, organization.id),
    getExpenseRows(supabase, organization.id),
  ]);

  if (projectsError) throw projectsError;
  if (activeProjectsError) throw activeProjectsError;
  if (openTasksError) throw openTasksError;
  if (expensesError) throw expensesError;
  if (updatesError) throw updatesError;

  const openTaskRows = openTasks ?? [];
  const totalExpenses = (expenses ?? []).reduce((sum, item) => sum + Number(item.amount), 0);
  const vendorTotals = new Map<string, { name: string; spend: number }>();
  const categoryTotals = new Map<string, number>();

  for (const expense of expenseRows) {
    if (expense.vendor_id) {
      const vendorName = Array.isArray(expense.vendor) ? expense.vendor[0]?.name : expense.vendor?.name;
      const current = vendorTotals.get(expense.vendor_id) ?? {
        name: vendorName ?? "Unknown vendor",
        spend: 0,
      };
      current.spend += Number(expense.amount);
      vendorTotals.set(expense.vendor_id, current);
    }

    categoryTotals.set(
      expense.category,
      (categoryTotals.get(expense.category) ?? 0) + Number(expense.amount),
    );
  }

  const projectsBySpend = projectHealthRows
    .slice()
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 5);

  const overdueTaskAlerts = openTaskRows
    .filter((task) => task.due_date && new Date(task.due_date) < today)
    .slice(0, 5)
    .map((task) => ({
      id: task.id,
      title: task.title,
      dueDate: task.due_date,
      status: task.status,
      projectId: task.project_id,
      projectName: relationName(task.project),
    }));

  const blockedTaskAlerts = openTaskRows
    .filter((task) => task.status === "blocked")
    .slice(0, 5)
    .map((task) => ({
      id: task.id,
      title: task.title,
      dueDate: task.due_date,
      status: task.status,
      projectId: task.project_id,
      projectName: relationName(task.project),
    }));

  const overBudgetProjectAlerts = projectHealthRows
    .filter((project) => project.spend > project.plannedBudget)
    .sort(
      (left, right) =>
        right.spend - right.plannedBudget - (left.spend - left.plannedBudget) || right.spend - left.spend,
    )
    .slice(0, 5)
    .map((project) => ({
      id: project.id,
      name: project.name,
      spend: project.spend,
      plannedBudget: project.plannedBudget,
      overdueTasks: project.overdueTasks,
      lastUpdateAt: project.lastUpdateAt,
    }));

  const staleProjectAlerts = projectHealthRows
    .filter((project) => daysSince(project.lastUpdateAt) > 7)
    .sort(
      (left, right) =>
        daysSince(right.lastUpdateAt) - daysSince(left.lastUpdateAt) || right.overdueTasks - left.overdueTasks,
    )
    .slice(0, 5)
    .map((project) => ({
      id: project.id,
      name: project.name,
      spend: project.spend,
      overdueTasks: project.overdueTasks,
      lastUpdateAt: project.lastUpdateAt,
    }));

  const topVendorsBySpend = Array.from(vendorTotals.entries())
    .map(([id, value]) => ({ id, name: value.name, spend: value.spend }))
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 5);

  const highestExpenseCategories = Array.from(categoryTotals.entries())
    .map(([category, spend]) => ({ category, spend }))
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 5);

  const tasksDueToday = openTaskRows
    .filter((task) => task.due_date && new Date(task.due_date) >= today && new Date(task.due_date) < tomorrow)
    .slice(0, 5)
    .map((task) => ({
      id: task.id,
      title: task.title,
      dueDate: task.due_date,
      status: task.status,
      projectId: task.project_id,
      projectName: relationName(task.project),
    }));

  const staleProjectsToday = projectHealthRows
    .filter((project) => daysSince(project.lastUpdateAt) > 3)
    .sort(
      (left, right) =>
        daysSince(right.lastUpdateAt) - daysSince(left.lastUpdateAt) || right.overdueTasks - left.overdueTasks,
    )
    .slice(0, 5)
    .map((project) => ({
      id: project.id,
      name: project.name,
      overdueTasks: project.overdueTasks,
      lastUpdateAt: project.lastUpdateAt,
    }));

  const updatesFromToday = (recentUpdates ?? [])
    .filter((update) => isSameDay(update.created_at, today))
    .slice(0, 5)
    .map((update) => ({
      id: update.id,
      title: update.title,
      description: update.description,
      createdAt: update.created_at,
      createdBy: update.created_by,
      projectId: update.project_id,
      projectName: relationName(update.project),
    }));

  return {
    organization,
    currentUserId: userId,
    metrics: {
      totalProjects: totalProjects ?? 0,
      activeProjects: activeProjects ?? 0,
      totalOpenTasks: openTaskRows.length,
      overdueTasks: openTaskRows.filter((task) => task.due_date && new Date(task.due_date) < today).length,
      totalExpenses,
      projectsOverBudget: projectHealthRows.filter((project) => project.spend > project.plannedBudget).length,
      projectsWithOverdueTasks: projectHealthRows.filter((project) => project.overdueTasks > 0).length,
      projectsWithoutRecentUpdates: projectHealthRows.filter((project) => daysSince(project.lastUpdateAt) > 7).length,
    },
    openTasks: openTaskRows,
    recentUpdates: recentUpdates ?? [],
    topProjectsBySpend: projectsBySpend,
    topVendorsBySpend,
    highestExpenseCategories,
    today: {
      tasksDueToday: {
        count: openTaskRows.filter(
          (task) => task.due_date && new Date(task.due_date) >= today && new Date(task.due_date) < tomorrow,
        ).length,
        items: tasksDueToday,
      },
      overdueTasks: {
        count: openTaskRows.filter((task) => task.due_date && new Date(task.due_date) < today).length,
        items: overdueTaskAlerts,
      },
      blockedTasks: {
        count: openTaskRows.filter((task) => task.status === "blocked").length,
        items: blockedTaskAlerts,
      },
      staleProjects: {
        count: projectHealthRows.filter((project) => daysSince(project.lastUpdateAt) > 3).length,
        items: staleProjectsToday,
      },
      recentFieldUpdates: {
        count: (recentUpdates ?? []).filter((update) => isSameDay(update.created_at, today)).length,
        items: updatesFromToday,
      },
    },
    attentionCenter: {
      overdueTasks: {
        severity: "High" as const,
        count: openTaskRows.filter((task) => task.due_date && new Date(task.due_date) < today).length,
        items: overdueTaskAlerts,
      },
      projectsOverBudget: {
        severity: "High" as const,
        count: projectHealthRows.filter((project) => project.spend > project.plannedBudget).length,
        items: overBudgetProjectAlerts,
      },
      staleProjects: {
        severity: "Medium" as const,
        count: projectHealthRows.filter((project) => daysSince(project.lastUpdateAt) > 7).length,
        items: staleProjectAlerts,
      },
      blockedTasks: {
        severity: "High" as const,
        count: openTaskRows.filter((task) => task.status === "blocked").length,
        items: blockedTaskAlerts,
      },
    },
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

export async function getProjectsCommandView({
  filter = "all",
  sort = "newest",
  query = "",
}: {
  filter?: string;
  sort?: string;
  query?: string;
}) {
  const { supabase, organization } = await getCurrentOrganization();
  const rows = await getProjectHealthRows(supabase, organization.id);
  const normalizedQuery = query.trim().toLowerCase();

  const normalizedFilter =
    filter === "On Track" || filter === "At Risk" || filter === "Needs Attention"
      ? filter
      : "all";
  const normalizedSort =
    sort === "highest_spend" || sort === "most_overdue" || sort === "stalest_updates"
      ? sort
      : "newest";

  const filteredRows =
    normalizedFilter === "all"
      ? rows
      : rows.filter((project) => project.healthStatus === normalizedFilter);

  const searchedRows = normalizedQuery
    ? filteredRows.filter((project) => {
        const name = project.name.toLowerCase();
        const address = project.address?.toLowerCase() ?? "";
        return name.includes(normalizedQuery) || address.includes(normalizedQuery);
      })
    : filteredRows;

  const sortedRows = searchedRows.slice().sort((left, right) => {
    if (normalizedSort === "highest_spend") {
      return right.spend - left.spend || new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    }

    if (normalizedSort === "most_overdue") {
      return (
        right.overdueTasks - left.overdueTasks ||
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      );
    }

    if (normalizedSort === "stalest_updates") {
      return (
        daysSince(right.lastUpdateAt) - daysSince(left.lastUpdateAt) ||
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      );
    }

    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });

  return {
    filter: normalizedFilter,
    sort: normalizedSort,
    query,
    projects: sortedRows,
  };
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

export async function getProjectHealth(projectId: string) {
  const { supabase, organization } = await getCurrentOrganization();
  const today = startOfToday();
  const [{ data: project, error: projectError }, { data: tasks, error: tasksError }, { data: expenses, error: expensesError }, { data: updates, error: updatesError }] =
    await Promise.all([
      supabase
        .from("projects")
        .select("id, planned_budget")
        .eq("organization_id", organization.id)
        .eq("id", projectId)
        .maybeSingle(),
      supabase
        .from("tasks")
        .select("id, due_date, status")
        .eq("organization_id", organization.id)
        .eq("project_id", projectId),
      supabase
        .from("expenses")
        .select("amount")
        .eq("organization_id", organization.id)
        .eq("project_id", projectId),
      supabase
        .from("field_updates")
        .select("created_at")
        .eq("organization_id", organization.id)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(1),
    ]);

  if (projectError) throw projectError;
  if (tasksError) throw tasksError;
  if (expensesError) throw expensesError;
  if (updatesError) throw updatesError;
  if (!project) notFound();

  const taskRows = tasks ?? [];
  const totalTasks = taskRows.length;
  const openTasks = taskRows.filter((task) => task.status !== "done").length;
  const overdueTasks = taskRows.filter(
    (task) => task.status !== "done" && task.due_date && new Date(task.due_date) < today,
  ).length;
  const actualSpend = (expenses ?? []).reduce((sum, expense) => sum + Number(expense.amount), 0);
  const plannedBudget = Number(project.planned_budget ?? 0);
  const budgetVariance = actualSpend - plannedBudget;
  const lastFieldUpdateAt = updates?.[0]?.created_at ?? null;

  return {
    plannedBudget,
    actualSpend,
    budgetVariance,
    totalTasks,
    openTasks,
    overdueTasks,
    lastFieldUpdateAt,
    healthStatus: calculateProjectHealth({
      plannedBudget,
      actualSpend,
      overdueTasks,
      lastUpdateAt: lastFieldUpdateAt,
    }),
  };
}

export async function getProjectActionSnapshot(projectId: string) {
  const { supabase, organization, userId } = await getCurrentOrganization();
  const today = startOfToday();

  const [{ data: tasks, error: tasksError }, { data: expenses, error: expensesError }, { data: updates, error: updatesError }] =
    await Promise.all([
      supabase
        .from("tasks")
        .select("id, title, description, due_date, status, priority, created_at")
        .eq("organization_id", organization.id)
        .eq("project_id", projectId),
      supabase
        .from("expenses")
        .select("id, category, amount, expense_date, notes, created_at, vendor:vendors(name)")
        .eq("organization_id", organization.id)
        .eq("project_id", projectId)
        .order("expense_date", { ascending: false }),
      supabase
        .from("field_updates")
        .select("id, title, description, created_at, created_by")
        .eq("organization_id", organization.id)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false }),
    ]);

  if (tasksError) throw tasksError;
  if (expensesError) throw expensesError;
  if (updatesError) throw updatesError;

  const taskRows = (tasks ?? []) as Array<{
    id: string;
    title: string;
    description: string | null;
    due_date: string | null;
    status: "not_started" | "in_progress" | "blocked" | "done";
    priority: "low" | "medium" | "high" | "urgent";
    created_at: string;
  }>;
  const expenseRows = (expenses ?? []) as Array<{
    id: string;
    category: string;
    amount: number;
    expense_date: string;
    notes: string | null;
    created_at: string;
    vendor?: { name: string } | { name: string }[] | null;
  }>;
  const updateRows = (updates ?? []) as Array<{
    id: string;
    title: string;
    description: string | null;
    created_at: string;
    created_by: string | null;
  }>;

  const overdueTasks = taskRows
    .filter((task) => task.status !== "done" && task.due_date && new Date(task.due_date) < today)
    .sort(
      (left, right) =>
        new Date(left.due_date ?? left.created_at).getTime() -
        new Date(right.due_date ?? right.created_at).getTime(),
    );

  const blockedTasks = taskRows
    .filter((task) => task.status === "blocked")
    .sort(
      (left, right) =>
        new Date(left.due_date ?? left.created_at).getTime() -
        new Date(right.due_date ?? right.created_at).getTime(),
    );

  const dueSoonTasks = taskRows
    .filter((task) => task.status !== "done" && task.due_date && new Date(task.due_date) >= today)
    .sort((left, right) => new Date(left.due_date ?? left.created_at).getTime() - new Date(right.due_date ?? right.created_at).getTime());

  return {
    currentUserId: userId,
    overdueTasks: {
      count: overdueTasks.length,
      items: overdueTasks.slice(0, 5),
    },
    blockedTasks: {
      count: blockedTasks.length,
      items: blockedTasks.slice(0, 5),
    },
    dueSoonTasks: {
      count: dueSoonTasks.length,
      items: dueSoonTasks.slice(0, 5),
    },
    recentExpenses: {
      count: expenseRows.length,
      items: expenseRows.slice(0, 5).map((expense) => ({
        ...expense,
        vendorName: relationName(expense.vendor),
      })),
    },
    recentUpdates: {
      count: updateRows.length,
      items: updateRows.slice(0, 5),
    },
  };
}

export async function getProjectSpendBreakdown(projectId: string) {
  const { supabase, organization } = await getCurrentOrganization();
  const { data, error } = await supabase
    .from("expenses")
    .select("id, category, amount, expense_date, vendor_id, vendor:vendors(name)")
    .eq("organization_id", organization.id)
    .eq("project_id", projectId)
    .order("expense_date", { ascending: false });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as Array<{
    id: string;
    category: string;
    amount: number;
    expense_date: string;
    vendor_id: string | null;
    vendor?: { name: string } | { name: string }[] | null;
  }>;

  const categoryTotals = new Map<string, { spend: number; count: number }>();
  const vendorTotals = new Map<string, { name: string; spend: number; count: number }>();

  for (const expense of rows) {
    const currentCategory = categoryTotals.get(expense.category) ?? { spend: 0, count: 0 };
    currentCategory.spend += Number(expense.amount);
    currentCategory.count += 1;
    categoryTotals.set(expense.category, currentCategory);

    if (!expense.vendor_id) continue;

    const vendorName = relationName(expense.vendor) ?? "Unknown vendor";
    const currentVendor = vendorTotals.get(expense.vendor_id) ?? {
      name: vendorName,
      spend: 0,
      count: 0,
    };
    currentVendor.spend += Number(expense.amount);
    currentVendor.count += 1;
    vendorTotals.set(expense.vendor_id, currentVendor);
  }

  return {
    totalExpensesCount: rows.length,
    vendorLinkedExpensesCount: rows.filter((expense) => Boolean(expense.vendor_id)).length,
    topCategories: Array.from(categoryTotals.entries())
      .map(([category, value]) => ({
        category,
        spend: value.spend,
        count: value.count,
      }))
      .sort((left, right) => right.spend - left.spend)
      .slice(0, 5),
    topVendors: Array.from(vendorTotals.entries())
      .map(([id, value]) => ({
        id,
        name: value.name,
        spend: value.spend,
        count: value.count,
      }))
      .sort((left, right) => right.spend - left.spend)
      .slice(0, 5),
  };
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

export async function getTasksCommandView({
  filter = "all",
  sort = "due_soon",
  query = "",
}: {
  filter?: string;
  sort?: string;
  query?: string;
}) {
  const { supabase, organization } = await getCurrentOrganization();
  const rows = ((await getTasks()) ?? []) as Array<{
    id: string;
    title: string;
    description: string | null;
    due_date: string | null;
    priority: "low" | "medium" | "high" | "urgent";
    status: "not_started" | "in_progress" | "blocked" | "done";
    project_id: string;
    assignee_id: string | null;
    created_at: string;
    project?: { name: string } | { name: string }[] | null;
  }>;
  const normalizedQuery = query.trim().toLowerCase();
  const normalizedFilter =
    filter === "not_started" ||
    filter === "in_progress" ||
    filter === "blocked" ||
    filter === "done" ||
    filter === "overdue" ||
    filter === "unassigned"
      ? filter
      : "all";
  const normalizedSort =
    sort === "overdue_first" || sort === "highest_priority" || sort === "newest"
      ? sort
      : "due_soon";

  const filteredRows = rows.filter((task) => {
    if (normalizedFilter === "all") return true;
    if (normalizedFilter === "overdue") {
      return task.status !== "done" && task.due_date ? new Date(task.due_date) < startOfToday() : false;
    }
    if (normalizedFilter === "unassigned") return !task.assignee_id;
    return task.status === normalizedFilter;
  });

  const searchedRows = normalizedQuery
    ? filteredRows.filter((task) => {
        const title = task.title.toLowerCase();
        const description = task.description?.toLowerCase() ?? "";
        return title.includes(normalizedQuery) || description.includes(normalizedQuery);
      })
    : filteredRows;

  const priorityWeight = {
    urgent: 4,
    high: 3,
    medium: 2,
    low: 1,
  } as const;

  const sortedRows = searchedRows.slice().sort((left, right) => {
    const leftDue = left.due_date ? new Date(left.due_date).getTime() : Number.POSITIVE_INFINITY;
    const rightDue = right.due_date ? new Date(right.due_date).getTime() : Number.POSITIVE_INFINITY;
    const leftOverdue =
      left.status !== "done" && left.due_date ? (new Date(left.due_date) < startOfToday() ? 1 : 0) : 0;
    const rightOverdue =
      right.status !== "done" && right.due_date ? (new Date(right.due_date) < startOfToday() ? 1 : 0) : 0;

    if (normalizedSort === "overdue_first") {
      return (
        rightOverdue - leftOverdue ||
        leftDue - rightDue ||
        new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
      );
    }

    if (normalizedSort === "highest_priority") {
      return (
        priorityWeight[right.priority] - priorityWeight[left.priority] ||
        leftDue - rightDue ||
        new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
      );
    }

    if (normalizedSort === "newest") {
      return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
    }

    return leftDue - rightDue || new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
  });

  return {
    organizationId: organization.id,
    filter: normalizedFilter,
    sort: normalizedSort,
    query,
    tasks: sortedRows.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      dueDate: task.due_date,
      priority: task.priority,
      status: task.status,
      projectId: task.project_id,
      assigneeId: task.assignee_id,
      createdAt: task.created_at,
      project: task.project,
    })) as TaskCommandRow[],
  };
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

export async function getTaskTemplates() {
  const { supabase, organization } = await getCurrentOrganization();
  const { data, error } = await supabase
    .from("task_templates")
    .select("*")
    .eq("organization_id", organization.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as TaskTemplate[];
}

export async function getTaskTemplateDetail(templateId: string) {
  const { supabase, organization } = await getCurrentOrganization();
  const [{ data: template, error: templateError }, { data: items, error: itemsError }] = await Promise.all([
    supabase
      .from("task_templates")
      .select("*")
      .eq("organization_id", organization.id)
      .eq("id", templateId)
      .maybeSingle(),
    supabase
      .from("task_template_items")
      .select("*")
      .eq("organization_id", organization.id)
      .eq("template_id", templateId)
      .order("sort_order")
      .order("created_at"),
  ]);

  if (templateError) {
    throw templateError;
  }

  if (itemsError) {
    throw itemsError;
  }

  if (!template) {
    notFound();
  }

  return {
    template: template as TaskTemplate,
    items: (items ?? []) as TaskTemplateItem[],
  };
}

export async function getExpenses() {
  const { supabase, organization } = await getCurrentOrganization();
  return await getExpenseRows(supabase, organization.id);
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

export async function getVendorIntelligence() {
  const { supabase, organization } = await getCurrentOrganization();
  const [vendors, expenseRows] = await Promise.all([
    getVendors(),
    getExpenseRows(supabase, organization.id),
  ]);

  const expenseMap = new Map<
    string,
    { totalLinkedExpenses: number; totalSpend: number; projectIds: Set<string>; lastExpenseDate: string | null }
  >();

  for (const expense of expenseRows) {
    if (!expense.vendor_id) continue;
    const current = expenseMap.get(expense.vendor_id) ?? {
      totalLinkedExpenses: 0,
      totalSpend: 0,
      projectIds: new Set<string>(),
      lastExpenseDate: null,
    };

    current.totalLinkedExpenses += 1;
    current.totalSpend += Number(expense.amount);
    current.projectIds.add(expense.project_id);
    if (!current.lastExpenseDate || new Date(expense.expense_date) > new Date(current.lastExpenseDate)) {
      current.lastExpenseDate = expense.expense_date;
    }
    expenseMap.set(expense.vendor_id, current);
  }

  return vendors.map((vendor) => {
    const stats = expenseMap.get(vendor.id);

    return {
      id: vendor.id,
      name: vendor.name,
      trade: vendor.trade,
      phone: vendor.phone,
      email: vendor.email,
      notes: vendor.notes,
      totalLinkedExpenses: stats?.totalLinkedExpenses ?? 0,
      totalSpend: stats?.totalSpend ?? 0,
      projectCount: stats?.projectIds.size ?? 0,
      lastExpenseDate: stats?.lastExpenseDate ?? null,
    } satisfies VendorIntelligenceRow;
  });
}

export async function getExpensesCommandView({
  filter = "all",
  sort = "newest",
  query = "",
}: {
  filter?: string;
  sort?: string;
  query?: string;
}) {
  const { supabase, organization } = await getCurrentOrganization();
  const rows = await getExpenseRows(supabase, organization.id);
  const normalizedQuery = query.trim().toLowerCase();
  const normalizedFilter =
    filter === "with_vendor" || filter === "no_vendor" || filter === "high_cost" || filter === "recent"
      ? filter
      : "all";
  const normalizedSort =
    sort === "highest_amount" || sort === "oldest" || sort === "project_name" ? sort : "newest";

  const filteredRows = rows.filter((expense) => {
    if (normalizedFilter === "all") return true;
    if (normalizedFilter === "with_vendor") return Boolean(expense.vendor_id);
    if (normalizedFilter === "no_vendor") return !expense.vendor_id;
    if (normalizedFilter === "high_cost") return Number(expense.amount) >= 1000;
    if (normalizedFilter === "recent") {
      const diff = Date.now() - new Date(expense.expense_date).getTime();
      return diff <= 1000 * 60 * 60 * 24 * 30;
    }
    return true;
  });

  const searchedRows = normalizedQuery
    ? filteredRows.filter((expense) => {
        const category = expense.category.toLowerCase();
        const notes = expense.notes?.toLowerCase() ?? "";
        const vendorName = (Array.isArray(expense.vendor) ? expense.vendor[0]?.name : expense.vendor?.name)?.toLowerCase() ?? "";
        const projectName = (Array.isArray(expense.project) ? expense.project[0]?.name : expense.project?.name)?.toLowerCase() ?? "";
        return (
          category.includes(normalizedQuery) ||
          notes.includes(normalizedQuery) ||
          vendorName.includes(normalizedQuery) ||
          projectName.includes(normalizedQuery)
        );
      })
    : filteredRows;

  const sortedRows = searchedRows.slice().sort((left, right) => {
    if (normalizedSort === "highest_amount") {
      return Number(right.amount) - Number(left.amount);
    }

    if (normalizedSort === "oldest") {
      return new Date(left.expense_date).getTime() - new Date(right.expense_date).getTime();
    }

    if (normalizedSort === "project_name") {
      const leftProject = Array.isArray(left.project) ? left.project[0]?.name ?? "" : left.project?.name ?? "";
      const rightProject = Array.isArray(right.project) ? right.project[0]?.name ?? "" : right.project?.name ?? "";
      return leftProject.localeCompare(rightProject) || new Date(right.expense_date).getTime() - new Date(left.expense_date).getTime();
    }

    return new Date(right.expense_date).getTime() - new Date(left.expense_date).getTime();
  });

  return {
    filter: normalizedFilter,
    sort: normalizedSort,
    query,
    expenses: sortedRows.map((expense) => ({
      id: expense.id,
      projectId: expense.project_id,
      vendorId: expense.vendor_id,
      category: expense.category,
      amount: Number(expense.amount),
      expenseDate: expense.expense_date,
      notes: expense.notes,
      createdAt: expense.created_at,
      project: expense.project,
      vendor: expense.vendor,
    })) as ExpenseCommandRow[],
  };
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

export async function getSettingsData() {
  const { supabase, organization, userId } = await getCurrentOrganization();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const [{ data: membership, error: membershipError }, { count: projectCount, error: projectsError }] =
    await Promise.all([
      supabase
        .from("organization_members")
        .select("role, created_at")
        .eq("organization_id", organization.id)
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organization.id),
    ]);

  if (membershipError) {
    throw membershipError;
  }

  if (projectsError) {
    throw projectsError;
  }

  const metadata = user.user_metadata as Record<string, unknown> | undefined;
  const fullName =
    typeof metadata?.full_name === "string"
      ? metadata.full_name
      : typeof metadata?.name === "string"
        ? metadata.name
        : null;

  return {
    user: {
      id: user.id,
      email: user.email ?? null,
      fullName,
      createdAt: user.created_at ?? null,
      lastSignInAt: user.last_sign_in_at ?? null,
    },
    organization,
    membership: {
      role: membership?.role ?? "member",
      joinedAt: membership?.created_at ?? null,
    },
    deployment: {
      appUrl: process.env.NEXT_PUBLIC_APP_URL ?? null,
      supabaseConfigured: Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      ),
    },
    workspaceSummary: {
      projectCount: projectCount ?? 0,
    },
  };
}
