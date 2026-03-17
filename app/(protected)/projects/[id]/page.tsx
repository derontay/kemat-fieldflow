import { FieldUpdateForm } from "@/components/projects/field-update-form";
import { ApplyTemplateForm } from "@/components/templates/apply-template-form";
import { ConfirmButton } from "@/components/confirm-button";
import { Topbar } from "@/components/layout/topbar";
import { Badge, ButtonLink, Card, EmptyState } from "@/components/ui";
import { createFieldUpdateAction, deleteFieldUpdateAction } from "@/lib/actions/crud";
import { applyTemplateToProjectAction } from "@/lib/actions/templates";
import {
  getProjectActionSnapshot,
  getProjectActivity,
  getProjectDetail,
  getProjectHealth,
  getProjectSpendBreakdown,
  getTaskTemplates,
} from "@/lib/data";
import { currency, formatDate, formatDateTime } from "@/lib/utils";

function statusTone(status: string): "default" | "success" | "warning" {
  if (status === "active") return "success";
  if (status === "on_hold") return "warning";
  return "default";
}

function statusLabel(status: string) {
  return status.replace("_", " ");
}

function healthTone(status: string): "success" | "warning" | "danger" {
  if (status === "On Track") return "success";
  if (status === "At Risk") return "warning";
  return "danger";
}

function tasksHref({
  filter = "all",
  sort = "due_soon",
  projectId,
}: {
  filter?: string;
  sort?: string;
  projectId?: string;
}) {
  const params = new URLSearchParams();
  if (filter !== "all") params.set("filter", filter);
  if (sort !== "due_soon") params.set("sort", sort);
  if (projectId) params.set("projectId", projectId);
  const queryString = params.toString();
  return queryString ? `/tasks?${queryString}` : "/tasks";
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, activity, templates, health, snapshot, spendBreakdown] = await Promise.all([
    getProjectDetail(id),
    getProjectActivity(id),
    getTaskTemplates(),
    getProjectHealth(id),
    getProjectActionSnapshot(id),
    getProjectSpendBreakdown(id),
  ]);

  return (
    <div className="space-y-6">
      <Topbar title={project.name} subtitle="Project detail for the current organization." />
      <div className="flex flex-wrap gap-3">
        <ButtonLink href="/projects" variant="ghost">
          Back to Projects
        </ButtonLink>
        <ButtonLink href={`/projects/${project.id}/edit`} variant="secondary">
          Edit Project
        </ButtonLink>
      </div>
      <Card className="space-y-6 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone={statusTone(project.status)}>{statusLabel(project.status)}</Badge>
          <p className="text-sm text-slate-600">{project.address || "No address added yet"}</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Start date</p>
            <p className="mt-2 font-medium text-ink">{formatDate(project.start_date)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Target completion</p>
            <p className="mt-2 font-medium text-ink">{formatDate(project.target_completion_date)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Planned budget</p>
            <p className="mt-2 font-medium text-ink">{currency(project.planned_budget)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Actual spend</p>
            <p className="mt-2 font-medium text-ink">{currency(project.actual_spend)}</p>
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Notes</p>
          <div className="mt-3 rounded-[1.5rem] bg-sand/70 p-5 text-sm text-slate-700">
            {project.notes || "No notes added yet."}
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Apply Template</p>
          <div className="mt-3">
            <ApplyTemplateForm
              projectId={project.id}
              templates={templates}
              action={applyTemplateToProjectAction}
            />
          </div>
        </div>
      </Card>
      <Card className="space-y-6 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-brand-700">Project Health</p>
            <h2 className="mt-2 font-serif text-3xl font-semibold text-ink">Budget + Delivery Status</h2>
          </div>
          <Badge tone={healthTone(health.healthStatus)}>{health.healthStatus}</Badge>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Planned budget</p>
            <p className="mt-2 font-medium text-ink">{currency(health.plannedBudget)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Total expenses</p>
            <p className="mt-2 font-medium text-ink">{currency(health.actualSpend)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Budget variance</p>
            <p className="mt-2 font-medium text-ink">{currency(health.budgetVariance)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Last field update</p>
            <p className="mt-2 font-medium text-ink">{formatDateTime(health.lastFieldUpdateAt)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Total tasks</p>
            <p className="mt-2 font-medium text-ink">{health.totalTasks}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Open tasks</p>
            <p className="mt-2 font-medium text-ink">{health.openTasks}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Overdue tasks</p>
            <p className="mt-2 font-medium text-ink">{health.overdueTasks}</p>
          </div>
        </div>
      </Card>
      <Card className="space-y-6 p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-brand-700">Action Snapshot</p>
          <h2 className="mt-2 font-serif text-3xl font-semibold text-ink">Operational Focus</h2>
          <p className="mt-2 text-sm text-slate-600">
            A read-only look at the issues and activity that matter most for this project.
          </p>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {[
            {
              key: "overdue",
              title: "Overdue Tasks",
              href: tasksHref({ filter: "overdue", sort: "overdue_first", projectId: project.id }),
              count: snapshot.overdueTasks.count,
              content:
                snapshot.overdueTasks.items.length === 0 ? (
                  <div className="mt-4 rounded-[1.25rem] border border-dashed border-slate-300 bg-white/80 p-4 text-sm text-slate-600">
                    No overdue tasks for this project.
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {snapshot.overdueTasks.items.map((task) => (
                      <div key={task.id} className="rounded-[1.25rem] border border-slate-200 bg-white/80 p-4">
                        <p className="font-medium text-ink">{task.title}</p>
                        <p className="mt-2 text-sm text-slate-600">Due: {formatDate(task.due_date)}</p>
                        <p className="mt-1 text-sm text-slate-600">Priority: {task.priority.replace("_", " ")}</p>
                      </div>
                    ))}
                  </div>
                ),
            },
            {
              key: "blocked",
              title: "Blocked Tasks",
              href: tasksHref({ filter: "blocked", sort: "overdue_first", projectId: project.id }),
              count: snapshot.blockedTasks.count,
              content:
                snapshot.blockedTasks.items.length === 0 ? (
                  <div className="mt-4 rounded-[1.25rem] border border-dashed border-slate-300 bg-white/80 p-4 text-sm text-slate-600">
                    No blocked tasks for this project.
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {snapshot.blockedTasks.items.map((task) => (
                      <div key={task.id} className="rounded-[1.25rem] border border-slate-200 bg-white/80 p-4">
                        <p className="font-medium text-ink">{task.title}</p>
                        <p className="mt-2 text-sm text-slate-600">Due: {formatDate(task.due_date)}</p>
                        <p className="mt-1 text-sm text-slate-600">Priority: {task.priority.replace("_", " ")}</p>
                      </div>
                    ))}
                  </div>
                ),
            },
            {
              key: "due-soon",
              title: "Tasks Due Soon",
              href: tasksHref({ filter: "all", sort: "due_soon", projectId: project.id }),
              count: snapshot.dueSoonTasks.count,
              content:
                snapshot.dueSoonTasks.items.length === 0 ? (
                  <div className="mt-4 rounded-[1.25rem] border border-dashed border-slate-300 bg-white/80 p-4 text-sm text-slate-600">
                    No upcoming due dates for this project.
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {snapshot.dueSoonTasks.items.map((task) => (
                      <div key={task.id} className="rounded-[1.25rem] border border-slate-200 bg-white/80 p-4">
                        <p className="font-medium text-ink">{task.title}</p>
                        <p className="mt-2 text-sm text-slate-600">Due: {formatDate(task.due_date)}</p>
                        <p className="mt-1 text-sm text-slate-600">Status: {task.status.replace("_", " ")}</p>
                      </div>
                    ))}
                  </div>
                ),
            },
            {
              key: "expenses",
              title: "Recent Expenses",
              href: "/expenses",
              count: snapshot.recentExpenses.count,
              content:
                snapshot.recentExpenses.items.length === 0 ? (
                  <div className="mt-4 rounded-[1.25rem] border border-dashed border-slate-300 bg-white/80 p-4 text-sm text-slate-600">
                    No expenses logged for this project yet.
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {snapshot.recentExpenses.items.map((expense) => (
                      <div key={expense.id} className="rounded-[1.25rem] border border-slate-200 bg-white/80 p-4">
                        <p className="font-medium text-ink">{expense.category} | {currency(expense.amount)}</p>
                        <p className="mt-2 text-sm text-slate-600">Vendor: {expense.vendorName || "No vendor"}</p>
                        <p className="mt-1 text-sm text-slate-600">Date: {formatDate(expense.expense_date)}</p>
                      </div>
                    ))}
                  </div>
                ),
            },
            {
              key: "updates",
              title: "Most Recent Field Updates",
              href: `/projects/${project.id}`,
              count: snapshot.recentUpdates.count,
              content:
                snapshot.recentUpdates.items.length === 0 ? (
                  <div className="mt-4 rounded-[1.25rem] border border-dashed border-slate-300 bg-white/80 p-4 text-sm text-slate-600">
                    No field updates for this project yet.
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {snapshot.recentUpdates.items.map((update) => (
                      <div key={update.id} className="rounded-[1.25rem] border border-slate-200 bg-white/80 p-4">
                        <p className="font-medium text-ink">{update.title}</p>
                        <p className="mt-2 text-sm text-slate-600">
                          {update.description || "No description added."}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {formatDateTime(update.created_at)} |{" "}
                          {update.created_by === snapshot.currentUserId
                            ? "You"
                            : update.created_by
                              ? "Workspace member"
                              : "Unknown user"}
                        </p>
                      </div>
                    ))}
                  </div>
                ),
            },
          ].map((group) => (
            <div key={group.key} className="rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-ink">{group.title}</p>
                <Badge>{group.count}</Badge>
              </div>
              {group.content}
              <div className="mt-4">
                <ButtonLink href={group.href} variant="ghost">
                  Open view
                </ButtonLink>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card className="space-y-6 p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-brand-700">Spend Breakdown</p>
          <h2 className="mt-2 font-serif text-3xl font-semibold text-ink">Category + Vendor Mix</h2>
          <p className="mt-2 text-sm text-slate-600">
            A read-only view of where project spend is concentrated.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Total expenses</p>
            <p className="mt-2 font-medium text-ink">{spendBreakdown.totalExpensesCount}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Vendor-linked expenses</p>
            <p className="mt-2 font-medium text-ink">{spendBreakdown.vendorLinkedExpensesCount}</p>
          </div>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-ink">Top Expense Categories</p>
              <Badge>{spendBreakdown.topCategories.length}</Badge>
            </div>
            {spendBreakdown.topCategories.length === 0 ? (
              <div className="mt-4 rounded-[1.25rem] border border-dashed border-slate-300 bg-white/80 p-4 text-sm text-slate-600">
                No expense categories logged for this project yet.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {spendBreakdown.topCategories.map((category) => (
                  <div key={category.category} className="rounded-[1.25rem] border border-slate-200 bg-white/80 p-4">
                    <p className="font-medium text-ink">{category.category}</p>
                    <p className="mt-2 text-sm text-slate-600">Spend: {currency(category.spend)}</p>
                    <p className="mt-1 text-sm text-slate-600">Expenses: {category.count}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-ink">Top Vendors By Spend</p>
              <Badge>{spendBreakdown.topVendors.length}</Badge>
            </div>
            {spendBreakdown.topVendors.length === 0 ? (
              <div className="mt-4 rounded-[1.25rem] border border-dashed border-slate-300 bg-white/80 p-4 text-sm text-slate-600">
                No vendor-linked expenses for this project yet.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {spendBreakdown.topVendors.map((vendor) => (
                  <div key={vendor.id} className="rounded-[1.25rem] border border-slate-200 bg-white/80 p-4">
                    <p className="font-medium text-ink">{vendor.name}</p>
                    <p className="mt-2 text-sm text-slate-600">Spend: {currency(vendor.spend)}</p>
                    <p className="mt-1 text-sm text-slate-600">Expenses: {vendor.count}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.25em] text-brand-700">New Activity</p>
          <FieldUpdateForm projectId={project.id} action={createFieldUpdateAction} />
        </div>
        <Card className="space-y-6 p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-brand-700">Project Activity</p>
            <h2 className="mt-2 font-serif text-3xl font-semibold text-ink">Field Updates</h2>
            <p className="mt-2 text-sm text-slate-600">Most recent project activity appears first.</p>
          </div>
          {activity.updates.length === 0 ? (
            <EmptyState
              title="No field updates yet"
              description="Post the first update for this project using the form on the left."
            />
          ) : (
            <div className="space-y-5">
              {activity.updates.map((update) => (
                <div key={update.id} className="relative border-l border-slate-300 pl-6">
                  <div className="absolute -left-[7px] top-2 h-3 w-3 rounded-full bg-brand-600" />
                  <div className="rounded-[1.5rem] border border-slate-200 bg-white/85 p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h3 className="font-serif text-2xl font-semibold text-ink">{update.title}</h3>
                        <p className="mt-2 text-sm text-slate-700">
                          {update.description || "No description added."}
                        </p>
                      </div>
                      <div className="flex flex-col items-start gap-3 md:items-end">
                        <div className="text-sm text-slate-500">
                          <p>{formatDateTime(update.created_at)}</p>
                          <p className="mt-1">
                            {update.created_by === activity.currentUserId
                              ? "You"
                              : update.created_by
                                ? "Workspace member"
                                : "Unknown user"}
                          </p>
                        </div>
                        <form action={deleteFieldUpdateAction}>
                          <input type="hidden" name="update_id" value={update.id} />
                          <input type="hidden" name="project_id" value={project.id} />
                          <ConfirmButton message="Delete this field update?" variant="ghost">
                            Delete
                          </ConfirmButton>
                        </form>
                      </div>
                    </div>
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
