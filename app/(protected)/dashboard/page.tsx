import Link from "next/link";
import { Topbar } from "@/components/layout/topbar";
import { Badge, ButtonLink, Card, EmptyState, StatCard } from "@/components/ui";
import { getDashboardData } from "@/lib/data";
import { cn, currency, formatDate, formatDateTime, isOverdue } from "@/lib/utils";

type DashboardTask = {
  id: string;
  title: string;
  due_date: string | null;
  status: string;
  project_id: string;
  project?: { name: string } | { name: string }[] | null;
};

type DashboardUpdate = {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  created_by: string | null;
  project_id: string;
  project?: { name: string } | { name: string }[] | null;
};

function relationName(value?: { name: string } | { name: string }[] | null) {
  if (Array.isArray(value)) return value[0]?.name ?? null;
  return value?.name ?? null;
}

function projectsHref({
  filter = "all",
  sort = "newest",
}: {
  filter?: string;
  sort?: string;
}) {
  const params = new URLSearchParams();
  if (filter !== "all") params.set("filter", filter);
  if (sort !== "newest") params.set("sort", sort);
  const queryString = params.toString();
  return queryString ? `/projects?${queryString}` : "/projects";
}

function tasksHref({
  filter = "all",
  sort = "due_soon",
}: {
  filter?: string;
  sort?: string;
}) {
  const params = new URLSearchParams();
  if (filter !== "all") params.set("filter", filter);
  if (sort !== "due_soon") params.set("sort", sort);
  const queryString = params.toString();
  return queryString ? `/tasks?${queryString}` : "/tasks";
}

function projectDetailHref(projectId: string) {
  return `/projects/${projectId}`;
}

export default async function DashboardPage() {
  const dashboard = await getDashboardData();
  const openTasks = dashboard.openTasks as DashboardTask[];
  const recentUpdates = dashboard.recentUpdates as DashboardUpdate[];
  const todayView = dashboard.today as {
    tasksDueToday: {
      count: number;
      items: Array<{
        id: string;
        title: string;
        dueDate: string | null;
        status: string;
        projectId: string;
        projectName: string | null;
      }>;
    };
    overdueTasks: {
      count: number;
      items: Array<{
        id: string;
        title: string;
        dueDate: string | null;
        status: string;
        projectId: string;
        projectName: string | null;
      }>;
    };
    blockedTasks: {
      count: number;
      items: Array<{
        id: string;
        title: string;
        dueDate: string | null;
        status: string;
        projectId: string;
        projectName: string | null;
      }>;
    };
    staleProjects: {
      count: number;
      items: Array<{
        id: string;
        name: string;
        overdueTasks: number;
        lastUpdateAt: string | null;
      }>;
    };
    recentFieldUpdates: {
      count: number;
      items: Array<{
        id: string;
        title: string;
        description: string | null;
        createdAt: string;
        createdBy: string | null;
        projectId: string;
        projectName: string | null;
      }>;
    };
  };
  const attentionCenter = dashboard.attentionCenter as {
    overdueTasks: {
      severity: "High" | "Medium" | "Low";
      count: number;
      items: Array<{
        id: string;
        title: string;
        dueDate: string | null;
        status: string;
        projectId: string;
        projectName: string | null;
      }>;
    };
    projectsOverBudget: {
      severity: "High" | "Medium" | "Low";
      count: number;
      items: Array<{
        id: string;
        name: string;
        spend: number;
        plannedBudget: number;
        overdueTasks: number;
        lastUpdateAt: string | null;
      }>;
    };
    staleProjects: {
      severity: "High" | "Medium" | "Low";
      count: number;
      items: Array<{
        id: string;
        name: string;
        spend: number;
        overdueTasks: number;
        lastUpdateAt: string | null;
      }>;
    };
    blockedTasks: {
      severity: "High" | "Medium" | "Low";
      count: number;
      items: Array<{
        id: string;
        title: string;
        dueDate: string | null;
        status: string;
        projectId: string;
        projectName: string | null;
      }>;
    };
  };
  const topProjectsBySpend = dashboard.topProjectsBySpend as Array<{
    id: string;
    name: string;
    spend: number;
    plannedBudget: number;
    overdueTasks: number;
    lastUpdateAt: string | null;
    healthStatus: "On Track" | "At Risk" | "Needs Attention";
  }>;
  const topVendorsBySpend = dashboard.topVendorsBySpend as Array<{
    id: string;
    name: string;
    spend: number;
  }>;
  const highestExpenseCategories = dashboard.highestExpenseCategories as Array<{
    category: string;
    spend: number;
  }>;

  function healthTone(status: string): "success" | "warning" | "danger" {
    if (status === "On Track") return "success";
    if (status === "At Risk") return "warning";
    return "danger";
  }

  function severityTone(severity: "High" | "Medium" | "Low"): "danger" | "warning" | "default" {
    if (severity === "High") return "danger";
    if (severity === "Medium") return "warning";
    return "default";
  }

  return (
    <div className="space-y-6">
      <Topbar
        title="Dashboard"
        subtitle={`A read-only overview for ${dashboard.organization.name} across projects, tasks, expenses, and field activity.`}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Projects" value={dashboard.metrics.totalProjects} />
        <StatCard label="Active Projects" value={dashboard.metrics.activeProjects} tone="default" />
        <StatCard label="Open Tasks" value={dashboard.metrics.totalOpenTasks} tone="warning" />
        <StatCard label="Overdue Tasks" value={dashboard.metrics.overdueTasks} tone="danger" />
        <StatCard label="Total Expenses" value={currency(dashboard.metrics.totalExpenses)} />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Link href={projectsHref({ filter: "Needs Attention", sort: "highest_spend" })} className="block">
          <StatCard label="Projects Over Budget" value={dashboard.metrics.projectsOverBudget} tone="danger" />
        </Link>
        <Link href={projectsHref({ filter: "At Risk", sort: "most_overdue" })} className="block">
          <StatCard
            label="Projects With Overdue Tasks"
            value={dashboard.metrics.projectsWithOverdueTasks}
            tone="warning"
          />
        </Link>
        <Link href={projectsHref({ filter: "At Risk", sort: "stalest_updates" })} className="block">
          <StatCard
            label="No Updates In 7 Days"
            value={dashboard.metrics.projectsWithoutRecentUpdates}
            tone="warning"
          />
        </Link>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          href={projectsHref({ filter: "Needs Attention", sort: "highest_spend" })}
          className={cn("inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50")}
        >
          Review over-budget projects
        </Link>
        <Link
          href={projectsHref({ filter: "At Risk", sort: "most_overdue" })}
          className={cn("inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50")}
        >
          Review overdue-task projects
        </Link>
        <Link
          href={projectsHref({ filter: "At Risk", sort: "stalest_updates" })}
          className={cn("inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50")}
        >
          Review stale-update projects
        </Link>
      </div>
      <Card className="space-y-5 p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-brand-700">Today</p>
            <h2 className="mt-2 font-serif text-3xl font-semibold text-ink">Morning Operations View</h2>
          </div>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {[
            {
              key: "due-today",
              title: "Tasks Due Today",
              description: "Tasks that need attention before the day ends.",
              href: tasksHref({ filter: "all", sort: "due_soon" }),
              count: todayView.tasksDueToday.count,
              content:
                todayView.tasksDueToday.items.length === 0 ? (
                  <div className="mt-4 rounded-[1.25rem] border border-dashed border-slate-300 bg-white/80 p-4 text-sm text-slate-600">
                    No tasks are due today.
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {todayView.tasksDueToday.items.map((item) => (
                      <Link
                        key={item.id}
                        href={projectDetailHref(item.projectId)}
                        className="block rounded-[1.25rem] border border-slate-200 bg-white/80 p-4 transition hover:border-brand-300 hover:shadow-panel"
                      >
                        <p className="font-medium text-ink">{item.title}</p>
                        <p className="mt-2 text-sm text-slate-600">
                          Project: {item.projectName || "Unknown project"}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">Due: {formatDate(item.dueDate)}</p>
                      </Link>
                    ))}
                  </div>
                ),
            },
            {
              key: "overdue",
              title: "Overdue Tasks",
              description: "Carry-over work that is already past due.",
              href: tasksHref({ filter: "overdue", sort: "overdue_first" }),
              count: todayView.overdueTasks.count,
              content:
                todayView.overdueTasks.items.length === 0 ? (
                  <div className="mt-4 rounded-[1.25rem] border border-dashed border-slate-300 bg-white/80 p-4 text-sm text-slate-600">
                    No overdue tasks right now.
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {todayView.overdueTasks.items.map((item) => (
                      <Link
                        key={item.id}
                        href={projectDetailHref(item.projectId)}
                        className="block rounded-[1.25rem] border border-slate-200 bg-white/80 p-4 transition hover:border-brand-300 hover:shadow-panel"
                      >
                        <p className="font-medium text-ink">{item.title}</p>
                        <p className="mt-2 text-sm text-slate-600">
                          Project: {item.projectName || "Unknown project"}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">Due: {formatDate(item.dueDate)}</p>
                      </Link>
                    ))}
                  </div>
                ),
            },
            {
              key: "blocked",
              title: "Blocked Tasks",
              description: "Work that needs unblockers before progress can resume.",
              href: tasksHref({ filter: "blocked", sort: "overdue_first" }),
              count: todayView.blockedTasks.count,
              content:
                todayView.blockedTasks.items.length === 0 ? (
                  <div className="mt-4 rounded-[1.25rem] border border-dashed border-slate-300 bg-white/80 p-4 text-sm text-slate-600">
                    No blocked tasks right now.
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {todayView.blockedTasks.items.map((item) => (
                      <Link
                        key={item.id}
                        href={projectDetailHref(item.projectId)}
                        className="block rounded-[1.25rem] border border-slate-200 bg-white/80 p-4 transition hover:border-brand-300 hover:shadow-panel"
                      >
                        <p className="font-medium text-ink">{item.title}</p>
                        <p className="mt-2 text-sm text-slate-600">
                          Project: {item.projectName || "Unknown project"}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">Due: {formatDate(item.dueDate)}</p>
                      </Link>
                    ))}
                  </div>
                ),
            },
            {
              key: "stale-projects",
              title: "Projects With No Updates In 3 Days",
              description: "Projects that may need a fresh field update or status check-in.",
              href: projectsHref({ filter: "At Risk", sort: "stalest_updates" }),
              count: todayView.staleProjects.count,
              content:
                todayView.staleProjects.items.length === 0 ? (
                  <div className="mt-4 rounded-[1.25rem] border border-dashed border-slate-300 bg-white/80 p-4 text-sm text-slate-600">
                    All tracked projects have recent updates.
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {todayView.staleProjects.items.map((item) => (
                      <Link
                        key={item.id}
                        href={projectDetailHref(item.id)}
                        className="block rounded-[1.25rem] border border-slate-200 bg-white/80 p-4 transition hover:border-brand-300 hover:shadow-panel"
                      >
                        <p className="font-medium text-ink">{item.name}</p>
                        <p className="mt-2 text-sm text-slate-600">
                          Last update: {formatDateTime(item.lastUpdateAt)}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">Overdue tasks: {item.overdueTasks}</p>
                      </Link>
                    ))}
                  </div>
                ),
            },
            {
              key: "updates-today",
              title: "Recent Field Updates From Today",
              description: "Today’s newest project activity and site notes.",
              href: "/projects",
              count: todayView.recentFieldUpdates.count,
              content:
                todayView.recentFieldUpdates.items.length === 0 ? (
                  <div className="mt-4 rounded-[1.25rem] border border-dashed border-slate-300 bg-white/80 p-4 text-sm text-slate-600">
                    No field updates have been posted today.
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {todayView.recentFieldUpdates.items.map((item) => (
                      <Link
                        key={item.id}
                        href={projectDetailHref(item.projectId)}
                        className="block rounded-[1.25rem] border border-slate-200 bg-white/80 p-4 transition hover:border-brand-300 hover:shadow-panel"
                      >
                        <p className="font-medium text-ink">{item.title}</p>
                        <p className="mt-2 text-sm text-slate-600">
                          {item.description || "No description added."}
                        </p>
                        <p className="mt-2 text-sm text-slate-600">
                          Project: {item.projectName || "Unknown project"}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">{formatDateTime(item.createdAt)}</p>
                      </Link>
                    ))}
                  </div>
                ),
            },
          ].map((group) => (
            <div key={group.key} className="rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-ink">{group.title}</p>
                  <p className="mt-2 text-sm text-slate-600">{group.description}</p>
                </div>
                <Badge>{group.count}</Badge>
              </div>
              {group.content}
              <div className="mt-4">
                <ButtonLink href={group.href} variant="ghost">
                  Open command view
                </ButtonLink>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card className="space-y-5 p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-brand-700">Attention Center</p>
            <h2 className="mt-2 font-serif text-3xl font-semibold text-ink">Highest-Priority Alerts</h2>
          </div>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {[
            {
              key: "overdue",
              title: "Overdue Tasks",
              description: "Incomplete tasks whose due date has already passed.",
              href: tasksHref({ filter: "overdue", sort: "overdue_first" }),
              severity: attentionCenter.overdueTasks.severity,
              count: attentionCenter.overdueTasks.count,
              content:
                attentionCenter.overdueTasks.items.length === 0 ? (
                  <div className="mt-4 rounded-[1.25rem] border border-dashed border-slate-300 bg-white/80 p-4 text-sm text-slate-600">
                    Nothing in this alert group right now.
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {attentionCenter.overdueTasks.items.map((item) => (
                      <Link
                        key={item.id}
                        href={projectDetailHref(item.projectId)}
                        className="block rounded-[1.25rem] border border-slate-200 bg-white/80 p-4 transition hover:border-brand-300 hover:shadow-panel"
                      >
                        <p className="font-medium text-ink">{item.title}</p>
                        <p className="mt-2 text-sm text-slate-600">
                          Project: {item.projectName || "Unknown project"}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">Due: {formatDate(item.dueDate)}</p>
                      </Link>
                    ))}
                  </div>
                ),
            },
            {
              key: "blocked",
              title: "Blocked Tasks",
              description: "Tasks flagged as blocked and likely preventing progress.",
              href: tasksHref({ filter: "blocked", sort: "overdue_first" }),
              severity: attentionCenter.blockedTasks.severity,
              count: attentionCenter.blockedTasks.count,
              content:
                attentionCenter.blockedTasks.items.length === 0 ? (
                  <div className="mt-4 rounded-[1.25rem] border border-dashed border-slate-300 bg-white/80 p-4 text-sm text-slate-600">
                    Nothing in this alert group right now.
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {attentionCenter.blockedTasks.items.map((item) => (
                      <Link
                        key={item.id}
                        href={projectDetailHref(item.projectId)}
                        className="block rounded-[1.25rem] border border-slate-200 bg-white/80 p-4 transition hover:border-brand-300 hover:shadow-panel"
                      >
                        <p className="font-medium text-ink">{item.title}</p>
                        <p className="mt-2 text-sm text-slate-600">
                          Project: {item.projectName || "Unknown project"}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">Due: {formatDate(item.dueDate)}</p>
                      </Link>
                    ))}
                  </div>
                ),
            },
            {
              key: "budget",
              title: "Projects Over Budget",
              description: "Projects where current expense totals exceed planned budget.",
              href: projectsHref({ filter: "Needs Attention", sort: "highest_spend" }),
              severity: attentionCenter.projectsOverBudget.severity,
              count: attentionCenter.projectsOverBudget.count,
              content:
                attentionCenter.projectsOverBudget.items.length === 0 ? (
                  <div className="mt-4 rounded-[1.25rem] border border-dashed border-slate-300 bg-white/80 p-4 text-sm text-slate-600">
                    Nothing in this alert group right now.
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {attentionCenter.projectsOverBudget.items.map((item) => (
                      <Link
                        key={item.id}
                        href={projectDetailHref(item.id)}
                        className="block rounded-[1.25rem] border border-slate-200 bg-white/80 p-4 transition hover:border-brand-300 hover:shadow-panel"
                      >
                        <p className="font-medium text-ink">{item.name}</p>
                        <p className="mt-2 text-sm text-slate-600">
                          Spend: {currency(item.spend)} of {currency(item.plannedBudget)}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">Overdue tasks: {item.overdueTasks}</p>
                      </Link>
                    ))}
                  </div>
                ),
            },
            {
              key: "stale",
              title: "Projects With No Updates In 7 Days",
              description: "Projects that may be drifting without recent field activity.",
              href: projectsHref({ filter: "At Risk", sort: "stalest_updates" }),
              severity: attentionCenter.staleProjects.severity,
              count: attentionCenter.staleProjects.count,
              content:
                attentionCenter.staleProjects.items.length === 0 ? (
                  <div className="mt-4 rounded-[1.25rem] border border-dashed border-slate-300 bg-white/80 p-4 text-sm text-slate-600">
                    Nothing in this alert group right now.
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {attentionCenter.staleProjects.items.map((item) => (
                      <Link
                        key={item.id}
                        href={projectDetailHref(item.id)}
                        className="block rounded-[1.25rem] border border-slate-200 bg-white/80 p-4 transition hover:border-brand-300 hover:shadow-panel"
                      >
                        <p className="font-medium text-ink">{item.name}</p>
                        <p className="mt-2 text-sm text-slate-600">
                          Last update: {formatDateTime(item.lastUpdateAt)}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">Overdue tasks: {item.overdueTasks}</p>
                      </Link>
                    ))}
                  </div>
                ),
            },
          ].map((group) => (
            <div key={group.key} className="rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-ink">{group.title}</p>
                  <p className="mt-2 text-sm text-slate-600">{group.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={severityTone(group.severity)}>{group.severity}</Badge>
                  <Badge>{group.count}</Badge>
                </div>
              </div>
              {group.content}
              <div className="mt-4">
                <ButtonLink href={group.href} variant="ghost">
                  Open command view
                </ButtonLink>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="space-y-5 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-brand-700">Task Summary</p>
              <h2 className="mt-2 font-serif text-3xl font-semibold text-ink">Open Tasks</h2>
            </div>
            <ButtonLink href={tasksHref({ filter: "all", sort: "due_soon" })} variant="ghost">
              View Tasks
            </ButtonLink>
          </div>
          {openTasks.length === 0 ? (
            <EmptyState
              title="No open tasks"
              description="Everything is clear right now."
              action={
                <ButtonLink href={tasksHref({ filter: "all", sort: "due_soon" })} variant="secondary">
                  Open tasks
                </ButtonLink>
              }
            />
          ) : (
            <div className="space-y-4">
              {openTasks.slice(0, 6).map((task) => (
                <Link
                  key={task.id}
                  href={task.status === "blocked" ? tasksHref({ filter: "blocked", sort: "overdue_first" }) : isOverdue(task.due_date) ? tasksHref({ filter: "overdue", sort: "overdue_first" }) : tasksHref({ filter: "all", sort: "due_soon" })}
                  className="block rounded-[1.5rem] border border-slate-200 bg-white/80 p-4 transition hover:border-brand-300 hover:shadow-panel"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-medium text-ink">{task.title}</h3>
                    <Badge tone={task.status === "blocked" ? "warning" : "default"}>
                      {task.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    Project: {relationName(task.project) || "Unknown project"}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">Due: {formatDate(task.due_date)}</p>
                </Link>
              ))}
            </div>
          )}
        </Card>
        <Card className="space-y-5 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-brand-700">Recent Activity</p>
              <h2 className="mt-2 font-serif text-3xl font-semibold text-ink">Field Updates</h2>
            </div>
            <ButtonLink href="/projects" variant="ghost">
              View Projects
            </ButtonLink>
          </div>
          {recentUpdates.length === 0 ? (
            <EmptyState
              title="No recent field updates"
              description="Post a project update to start the activity feed."
              action={
                <ButtonLink href="/projects" variant="secondary">
                  Open projects
                </ButtonLink>
              }
            />
          ) : (
            <div className="space-y-4">
              {recentUpdates.map((update) => (
                <div key={update.id} className="rounded-[1.5rem] border border-slate-200 bg-white/80 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="font-medium text-ink">{update.title}</h3>
                      <p className="mt-2 text-sm text-slate-600">
                        {update.description || "No description added."}
                      </p>
                    </div>
                    <div className="text-sm text-slate-500 md:text-right">
                      <p>{formatDateTime(update.created_at)}</p>
                      <p className="mt-1">
                        {update.created_by === dashboard.currentUserId
                          ? "You"
                          : update.created_by
                            ? "Workspace member"
                            : "Unknown user"}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">
                    Project: {relationName(update.project) || "Unknown project"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
      <Card className="space-y-5 p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-brand-700">Budget Intelligence</p>
            <h2 className="mt-2 font-serif text-3xl font-semibold text-ink">Top Projects By Spend</h2>
          </div>
          <ButtonLink href="/projects" variant="ghost">
            View Projects
          </ButtonLink>
        </div>
        {topProjectsBySpend.length === 0 ? (
          <EmptyState
            title="No project spend yet"
            description="Add expenses to projects to start comparing budget exposure across the workspace."
            action={
              <ButtonLink href="/expenses/new" variant="secondary">
                Create an expense
              </ButtonLink>
            }
          />
        ) : (
          <div className="space-y-4">
            {topProjectsBySpend.map((project) => (
              <div key={project.id} className="rounded-[1.5rem] border border-slate-200 bg-white/80 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="font-medium text-ink">{project.name}</h3>
                    <p className="mt-2 text-sm text-slate-600">
                      Spend: {currency(project.spend)} of {currency(project.plannedBudget)}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Overdue tasks: {project.overdueTasks} | Last update: {formatDateTime(project.lastUpdateAt)}
                    </p>
                  </div>
                  <Badge tone={healthTone(project.healthStatus)}>{project.healthStatus}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="space-y-5 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-brand-700">Vendor Intelligence</p>
              <h2 className="mt-2 font-serif text-3xl font-semibold text-ink">Top Vendors By Spend</h2>
            </div>
            <ButtonLink href="/vendors" variant="ghost">
              View Vendors
            </ButtonLink>
          </div>
          {topVendorsBySpend.length === 0 ? (
            <EmptyState
              title="No vendor spend yet"
              description="Link expenses to vendors to surface vendor concentration and spend patterns."
            />
          ) : (
            <div className="space-y-4">
              {topVendorsBySpend.map((vendor) => (
                <div key={vendor.id} className="rounded-[1.5rem] border border-slate-200 bg-white/80 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-medium text-ink">{vendor.name}</h3>
                    <Badge>{currency(vendor.spend)}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card className="space-y-5 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-brand-700">Expense Mix</p>
              <h2 className="mt-2 font-serif text-3xl font-semibold text-ink">Highest Expense Categories</h2>
            </div>
            <ButtonLink href="/expenses" variant="ghost">
              View Expenses
            </ButtonLink>
          </div>
          {highestExpenseCategories.length === 0 ? (
            <EmptyState
              title="No expense categories yet"
              description="Add expenses to see where spend is concentrated across the organization."
            />
          ) : (
            <div className="space-y-4">
              {highestExpenseCategories.map((category) => (
                <div
                  key={category.category}
                  className="rounded-[1.5rem] border border-slate-200 bg-white/80 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-medium text-ink">{category.category}</h3>
                    <Badge>{currency(category.spend)}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
