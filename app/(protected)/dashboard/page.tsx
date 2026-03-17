import { Topbar } from "@/components/layout/topbar";
import { Badge, ButtonLink, Card, EmptyState, StatCard } from "@/components/ui";
import { getDashboardData } from "@/lib/data";
import { currency, formatDate, formatDateTime } from "@/lib/utils";

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

export default async function DashboardPage() {
  const dashboard = await getDashboardData();
  const openTasks = dashboard.openTasks as DashboardTask[];
  const recentUpdates = dashboard.recentUpdates as DashboardUpdate[];

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
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="space-y-5 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-brand-700">Task Summary</p>
              <h2 className="mt-2 font-serif text-3xl font-semibold text-ink">Open Tasks</h2>
            </div>
            <ButtonLink href="/tasks" variant="ghost">
              View Tasks
            </ButtonLink>
          </div>
          {openTasks.length === 0 ? (
            <EmptyState
              title="No open tasks"
              description="Everything is clear right now."
              action={
                <ButtonLink href="/tasks/new" variant="secondary">
                  Create a task
                </ButtonLink>
              }
            />
          ) : (
            <div className="space-y-4">
              {openTasks.slice(0, 6).map((task) => (
                <div key={task.id} className="rounded-[1.5rem] border border-slate-200 bg-white/80 p-4">
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
                </div>
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
    </div>
  );
}
