import Link from "next/link";
import { Topbar } from "@/components/layout/topbar";
import { Badge, ButtonLink, Card, EmptyState, StatCard } from "@/components/ui";
import { getDashboardData, getExpenseSavedViewSummary, getTaskSavedViewSummary } from "@/lib/data";
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

type CommandTaskItem = {
  id: string;
  title: string;
  dueDate: string | null;
  status: string;
  projectId: string;
  projectName: string | null;
};

type StaleProjectItem = {
  id: string;
  name: string;
  overdueTasks: number;
  lastUpdateAt: string | null;
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

function projectDetailHref(projectId: string) {
  return `/projects/${projectId}`;
}

function expensesHref({
  vendorId,
  category,
}: {
  vendorId?: string;
  category?: string;
}) {
  const params = new URLSearchParams();
  if (vendorId) params.set("vendorId", vendorId);
  if (category) params.set("category", category);
  return `/expenses?${params.toString()}`;
}

function TaskOperationalCard({ item }: { item: CommandTaskItem }) {
  return (
    <div className="rounded-[1.25rem] border border-slate-200 bg-white/80 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <Link href={projectDetailHref(item.projectId)} className="font-medium text-ink transition hover:text-brand-700">
            {item.title}
          </Link>
          <p className="mt-2 text-sm text-slate-600">Project: {item.projectName || "Unknown project"}</p>
          <p className="mt-1 text-sm text-slate-600">Due: {formatDate(item.dueDate)}</p>
        </div>
        <Badge
          tone={
            item.status === "blocked"
              ? "warning"
              : isOverdue(item.dueDate) && item.status !== "done"
                ? "danger"
                : "default"
          }
        >
          {item.status.replace("_", " ")}
        </Badge>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
        <ButtonLink href={projectDetailHref(item.projectId)} variant="ghost">
          View Project
        </ButtonLink>
      </div>
    </div>
  );
}

function StaleProjectOperationalCard({ item }: { item: StaleProjectItem }) {
  return (
    <div className="rounded-[1.25rem] border border-slate-200 bg-white/80 p-4">
      <Link href={projectDetailHref(item.id)} className="font-medium text-ink transition hover:text-brand-700">
        {item.name}
      </Link>
      <p className="mt-2 text-sm text-slate-600">Last update: {formatDateTime(item.lastUpdateAt)}</p>
      <p className="mt-1 text-sm text-slate-600">Overdue tasks: {item.overdueTasks}</p>
      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
        <ButtonLink href={projectDetailHref(item.id)} variant="ghost">
          View Project
        </ButtonLink>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const [dashboard, taskSavedViewSummary, expenseSavedViewSummary] = await Promise.all([
    getDashboardData(),
    getTaskSavedViewSummary(),
    getExpenseSavedViewSummary(),
  ]);
  const openTasks = dashboard.openTasks as DashboardTask[];
  const recentUpdates = dashboard.recentUpdates as DashboardUpdate[];
  const todayView = dashboard.today as {
    tasksDueToday: { count: number; items: CommandTaskItem[] };
    overdueTasks: { count: number; items: CommandTaskItem[] };
    blockedTasks: { count: number; items: CommandTaskItem[] };
    staleProjects: { count: number; items: StaleProjectItem[] };
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
    overdueTasks: { severity: "High" | "Medium" | "Low"; count: number; items: CommandTaskItem[] };
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
    blockedTasks: { severity: "High" | "Medium" | "Low"; count: number; items: CommandTaskItem[] };
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

  const morningTaskLinks = {
    dueToday: taskSavedViewSummary.shortcuts.find((shortcut) => shortcut.key === "due_today")!,
    overdue: taskSavedViewSummary.shortcuts.find((shortcut) => shortcut.key === "overdue")!,
    blocked: taskSavedViewSummary.shortcuts.find((shortcut) => shortcut.key === "blocked")!,
    openTasks: {
      href: "/tasks",
      label: "Open command view" as const,
    },
  };

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
      <Card className="space-y-4 p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-brand-700">Morning Ops</p>
          <h2 className="mt-2 font-serif text-3xl font-semibold text-ink">Task Shortcuts</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {taskSavedViewSummary.shortcuts.map((shortcut) => (
            <div key={shortcut.key} className="rounded-[1.5rem] border border-slate-200 bg-white/80 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-ink">{shortcut.name}</p>
                  <p className="mt-2 text-sm text-slate-600">{shortcut.description}</p>
                </div>
                {shortcut.matchedView ? <Badge tone="success">Saved</Badge> : null}
              </div>
              <div className="mt-4">
                <ButtonLink href={shortcut.href} variant="ghost">
                  {shortcut.label}
                </ButtonLink>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card className="space-y-4 p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-brand-700">Morning Ops</p>
          <h2 className="mt-2 font-serif text-3xl font-semibold text-ink">Expense Shortcuts</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {expenseSavedViewSummary.shortcuts.map((shortcut) => (
            <div key={shortcut.key} className="rounded-[1.5rem] border border-slate-200 bg-white/80 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-ink">{shortcut.name}</p>
                  <p className="mt-2 text-sm text-slate-600">{shortcut.description}</p>
                </div>
                {shortcut.matchedView ? <Badge tone="success">Saved</Badge> : null}
              </div>
              <div className="mt-4">
                <ButtonLink href={shortcut.href} variant="ghost">
                  {shortcut.label}
                </ButtonLink>
              </div>
            </div>
          ))}
        </div>
      </Card>
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
              command: morningTaskLinks.dueToday,
              count: todayView.tasksDueToday.count,
              content:
                todayView.tasksDueToday.items.length === 0 ? (
                  <div className="mt-4 rounded-[1.25rem] border border-dashed border-slate-300 bg-white/80 p-4 text-sm text-slate-600">
                    No tasks are due today.
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {todayView.tasksDueToday.items.map((item) => (
                      <TaskOperationalCard key={item.id} item={item} />
                    ))}
                  </div>
                ),
            },
            {
              key: "overdue",
              title: "Overdue Tasks",
              description: "Carry-over work that is already past due.",
              command: morningTaskLinks.overdue,
              count: todayView.overdueTasks.count,
              content:
                todayView.overdueTasks.items.length === 0 ? (
                  <div className="mt-4 rounded-[1.25rem] border border-dashed border-slate-300 bg-white/80 p-4 text-sm text-slate-600">
                    No overdue tasks right now.
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {todayView.overdueTasks.items.map((item) => (
                      <TaskOperationalCard key={item.id} item={item} />
                    ))}
                  </div>
                ),
            },
            {
              key: "blocked",
              title: "Blocked Tasks",
              description: "Work that needs unblockers before progress can resume.",
              command: morningTaskLinks.blocked,
              count: todayView.blockedTasks.count,
              content:
                todayView.blockedTasks.items.length === 0 ? (
                  <div className="mt-4 rounded-[1.25rem] border border-dashed border-slate-300 bg-white/80 p-4 text-sm text-slate-600">
                    No blocked tasks right now.
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {todayView.blockedTasks.items.map((item) => (
                      <TaskOperationalCard key={item.id} item={item} />
                    ))}
                  </div>
                ),
            },
            {
              key: "stale-projects",
              title: "Projects With No Updates In 3 Days",
              description: "Projects that may need a fresh field update or status check-in.",
              command: {
                href: projectsHref({ filter: "At Risk", sort: "stalest_updates" }),
                label: "Open command view",
              },
              count: todayView.staleProjects.count,
              content:
                todayView.staleProjects.items.length === 0 ? (
                  <div className="mt-4 rounded-[1.25rem] border border-dashed border-slate-300 bg-white/80 p-4 text-sm text-slate-600">
                    All tracked projects have recent updates.
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {todayView.staleProjects.items.map((item) => (
                      <StaleProjectOperationalCard key={item.id} item={item} />
                    ))}
                  </div>
                ),
            },
            {
              key: "updates-today",
              title: "Recent Field Updates From Today",
              description: "Today's newest project activity and site notes.",
              command: {
                href: "/projects",
                label: "Open command view",
              },
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
                <ButtonLink href={group.command.href} variant="ghost">
                  {group.command.label}
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
              command: morningTaskLinks.overdue,
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
                      <TaskOperationalCard key={item.id} item={item} />
                    ))}
                  </div>
                ),
            },
            {
              key: "blocked",
              title: "Blocked Tasks",
              description: "Tasks flagged as blocked and likely preventing progress.",
              command: morningTaskLinks.blocked,
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
                      <TaskOperationalCard key={item.id} item={item} />
                    ))}
                  </div>
                ),
            },
            {
              key: "budget",
              title: "Projects Over Budget",
              description: "Projects where current expense totals exceed planned budget.",
              command: {
                href: projectsHref({ filter: "Needs Attention", sort: "highest_spend" }),
                label: "Open command view",
              },
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
              command: {
                href: projectsHref({ filter: "At Risk", sort: "stalest_updates" }),
                label: "Open command view",
              },
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
                      <StaleProjectOperationalCard
                        key={item.id}
                        item={{
                          id: item.id,
                          name: item.name,
                          overdueTasks: item.overdueTasks,
                          lastUpdateAt: item.lastUpdateAt,
                        }}
                      />
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
                <ButtonLink href={group.command.href} variant="ghost">
                  {group.command.label}
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
            <ButtonLink href={morningTaskLinks.openTasks.href} variant="ghost">
              {morningTaskLinks.openTasks.label}
            </ButtonLink>
          </div>
          {openTasks.length === 0 ? (
            <EmptyState
              title="No open tasks"
              description="Everything is clear right now."
              action={
                <ButtonLink href={morningTaskLinks.openTasks.href} variant="secondary">
                  {morningTaskLinks.openTasks.label}
                </ButtonLink>
              }
            />
          ) : (
            <div className="space-y-4">
              {openTasks.slice(0, 6).map((task) => {
                const item = {
                  id: task.id,
                  title: task.title,
                  dueDate: task.due_date,
                  status: task.status,
                  projectId: task.project_id,
                  projectName: relationName(task.project),
                };
                return <TaskOperationalCard key={task.id} item={item} />;
              })}
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
                <Link
                  key={vendor.id}
                  href={expensesHref({ vendorId: vendor.id })}
                  className="block rounded-[1.5rem] border border-slate-200 bg-white/80 p-4 transition hover:border-brand-300 hover:shadow-panel"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-medium text-ink">{vendor.name}</h3>
                    <Badge>{currency(vendor.spend)}</Badge>
                  </div>
                </Link>
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
                <Link
                  key={category.category}
                  href={expensesHref({ category: category.category })}
                  className="block rounded-[1.5rem] border border-slate-200 bg-white/80 p-4 transition hover:border-brand-300 hover:shadow-panel"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-medium text-ink">{category.category}</h3>
                    <Badge>{currency(category.spend)}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
