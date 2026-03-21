import Link from "next/link";
import { ConfirmButton } from "@/components/confirm-button";
import { Topbar } from "@/components/layout/topbar";
import { Badge, Button, ButtonLink, Card, EmptyState, Input, Select } from "@/components/ui";
import { updateTaskStatusAction } from "@/lib/actions/crud";
import {
  deleteSavedViewAction,
  pinSavedViewAction,
  renameSavedViewAction,
  saveViewAction,
  setDefaultSavedViewAction,
  unpinSavedViewAction,
} from "@/lib/actions/views";
import { getTaskSavedViewSummary, getTasksCommandView } from "@/lib/data";
import { cn, formatDate, isOverdue } from "@/lib/utils";
import type { SavedView } from "@/types/database";

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  status: "not_started" | "in_progress" | "blocked" | "done";
  projectId: string;
  assigneeId: string | null;
  project?: { name: string } | { name: string }[] | null;
};

function priorityTone(priority: string): "default" | "warning" | "danger" {
  if (priority === "urgent") return "danger";
  if (priority === "high") return "warning";
  return "default";
}

function statusTone(status: string): "default" | "success" | "warning" {
  if (status === "done") return "success";
  if (status === "blocked") return "warning";
  return "default";
}

function labelize(value: string) {
  return value.replace("_", " ");
}

function taskProjectName(task: TaskRow) {
  if (Array.isArray(task.project)) return task.project[0]?.name ?? "Unknown project";
  return task.project?.name ?? "Unknown project";
}

const filters = [
  { value: "all", label: "All" },
  { value: "due_today", label: "Due Today" },
  { value: "not_started", label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "blocked", label: "Blocked" },
  { value: "done", label: "Done" },
  { value: "overdue", label: "Overdue" },
  { value: "unassigned", label: "Unassigned" },
] as const;

const sorts = [
  { value: "due_soon", label: "Due Soon" },
  { value: "overdue_first", label: "Overdue First" },
  { value: "highest_priority", label: "Highest Priority" },
  { value: "newest", label: "Newest" },
] as const;

function buildTasksHref(filter: string, sort: string, query: string, projectId?: string | null) {
  const params = new URLSearchParams();
  if (filter !== "all") params.set("filter", filter);
  if (sort !== "due_soon") params.set("sort", sort);
  if (query.trim()) params.set("q", query.trim());
  if (projectId) params.set("projectId", projectId);
  const queryString = params.toString();
  return queryString ? `/tasks?${queryString}` : "/tasks";
}

function savedViewHref(view: SavedView) {
  const state = view.query_state ?? {};
  return buildTasksHref(
    state.filter ?? "all",
    state.sort ?? "due_soon",
    state.q ?? "",
    state.projectId ?? null,
  );
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams?: Promise<{ filter?: string; sort?: string; q?: string; projectId?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const [{ tasks, filter, sort, query, projectId, projectName }, taskSavedViewSummary] = await Promise.all([
    getTasksCommandView({
      filter: params.filter,
      sort: params.sort,
      query: params.q,
      projectId: params.projectId,
    }),
    getTaskSavedViewSummary(),
  ]);
  const { views: savedViews, supportsPriorityFields, supportsOwnershipFields, shortcuts: recommendedViews, currentUserId } =
    taskSavedViewSummary;
  const currentHref = buildTasksHref(filter, sort, query, projectId);
  const defaultView = supportsPriorityFields ? savedViews.find((view) => view.is_default) : undefined;
  const defaultHref = defaultView ? savedViewHref(defaultView) : null;
  const isDefaultViewActive = Boolean(defaultHref && defaultHref === currentHref);
  const dueTodayShortcut = recommendedViews.find((shortcut) => shortcut.key === "due_today");
  const personalViews = supportsOwnershipFields
    ? savedViews.filter((view) => view.user_id === currentUserId)
    : [];
  const teamViews = supportsOwnershipFields
    ? savedViews.filter((view) => view.user_id === null)
    : savedViews;

  function renderSavedView(view: SavedView) {
    return (
      <div
        key={view.id}
        className={cn(
          "rounded-[1.25rem] border bg-white p-3",
          view.is_default
            ? "border-brand-300 bg-brand-50/40"
            : view.is_pinned
              ? "border-slate-300"
              : "border-slate-200",
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={savedViewHref(view)}
            className="text-sm font-medium text-ink transition hover:text-brand-700"
          >
            {view.name}
          </Link>
          <div className="flex items-center gap-2">
            {supportsOwnershipFields ? (
              <Badge tone={view.user_id ? "default" : "success"}>{view.user_id ? "My View" : "Team View"}</Badge>
            ) : null}
            {supportsPriorityFields && view.is_pinned ? <Badge>Pinned</Badge> : null}
            {supportsPriorityFields && view.is_default ? <Badge tone="warning">Default</Badge> : null}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {supportsPriorityFields ? (
            <>
              <form action={view.is_pinned ? unpinSavedViewAction : pinSavedViewAction}>
                <input type="hidden" name="view_id" value={view.id} />
                <input type="hidden" name="type" value="tasks" />
                <Button type="submit" variant="ghost">
                  {view.is_pinned ? "Unpin" : "Pin"}
                </Button>
              </form>
              <form action={setDefaultSavedViewAction}>
                <input type="hidden" name="view_id" value={view.id} />
                <input type="hidden" name="type" value="tasks" />
                <Button type="submit" variant="ghost">
                  {view.is_default ? "Default View" : "Set Default"}
                </Button>
              </form>
            </>
          ) : null}
          <form action={deleteSavedViewAction}>
            <input type="hidden" name="view_id" value={view.id} />
            <input type="hidden" name="type" value="tasks" />
            <ConfirmButton message="Delete this saved view?" variant="ghost">
              Delete
            </ConfirmButton>
          </form>
        </div>
        <form action={renameSavedViewAction} className="mt-3 flex flex-col gap-2 md:flex-row">
          <input type="hidden" name="view_id" value={view.id} />
          <input type="hidden" name="type" value="tasks" />
          <Input name="name" defaultValue={view.name} className="bg-white" />
          <Button type="submit" variant="ghost">
            Rename
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Topbar
        title="Tasks"
        subtitle={
          projectName
            ? `Task command view for ${projectName}.`
            : "Track work items across the current organization and keep status updates tied to their projects."
        }
      />
      <Card className="space-y-6 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-brand-700">Task Board</p>
            <h1 className="mt-2 font-serif text-4xl font-semibold text-ink">Current Tasks</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-600">
              Create and manage task work items scoped to projects in your workspace.
            </p>
          </div>
          <ButtonLink href="/tasks/new">New Task</ButtonLink>
        </div>
        {projectName ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Active Project Context</p>
              <p className="mt-2 font-medium text-ink">{projectName}</p>
            </div>
            <ButtonLink href="/tasks" variant="ghost">
              Clear Project Filter
            </ButtonLink>
          </div>
        ) : null}
        {defaultView ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-brand-200 bg-brand-50/70 p-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-brand-700">
                {isDefaultViewActive ? "Default View Active" : "Default View"}
              </p>
              <p className="mt-2 font-medium text-ink">{defaultView.name}</p>
              <p className="mt-1 text-sm text-slate-600">
                {isDefaultViewActive
                  ? "You are currently working from the default task command view."
                  : "This saved view is marked as the default starting point for tasks."}
              </p>
            </div>
            {!isDefaultViewActive ? (
              <ButtonLink href={defaultHref ?? "/tasks"} variant="ghost">
                Open Default View
              </ButtonLink>
            ) : null}
          </div>
        ) : null}
        <div className="grid gap-4 rounded-[1.75rem] border border-slate-200 bg-white/75 p-4 md:grid-cols-[1.1fr_0.9fr]">
          <form action={saveViewAction} className="space-y-3">
            <input type="hidden" name="type" value="tasks" />
            <input type="hidden" name="filter" value={filter} />
            <input type="hidden" name="sort" value={sort} />
            <input type="hidden" name="q" value={query} />
            {projectId ? <input type="hidden" name="projectId" value={projectId} /> : null}
            <input type="hidden" name="redirect_to" value={currentHref} />
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Save View</p>
            <div className="flex flex-col gap-3 md:flex-row">
              <Input name="name" placeholder="Name this task view" className="bg-white" />
              {supportsOwnershipFields ? (
                <Select name="scope" defaultValue="personal" className="bg-white md:w-auto">
                  <option value="personal">Personal</option>
                  <option value="team">Team</option>
                </Select>
              ) : (
                <input type="hidden" name="scope" value="team" />
              )}
              <Button type="submit" variant="secondary">
                Save View
              </Button>
            </div>
          </form>
          <div className="space-y-3">
            <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/80 p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Morning Ops Recommended Views</p>
              <div className="mt-3 space-y-3">
                {recommendedViews.map((recommendedView) => (
                  <div
                    key={recommendedView.key}
                    className="rounded-[1rem] border border-slate-200 bg-white p-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-ink">
                          {recommendedView.matchedView?.name ?? recommendedView.name}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">{recommendedView.description}</p>
                      </div>
                      {recommendedView.matchedView ? (
                        <div className="flex items-center gap-2">
                          <Badge tone="success">Saved</Badge>
                          {supportsOwnershipFields ? (
                            <Badge tone={recommendedView.matchedView.user_id ? "default" : "success"}>
                              {recommendedView.matchedView.user_id ? "My View" : "Team View"}
                            </Badge>
                          ) : null}
                          {recommendedView.matchedView.is_pinned ? <Badge>Pinned</Badge> : null}
                          {recommendedView.matchedView.is_default ? <Badge tone="warning">Default</Badge> : null}
                        </div>
                      ) : (
                        <Badge tone="default">Recommended</Badge>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {recommendedView.matchedView ? (
                        <ButtonLink href={savedViewHref(recommendedView.matchedView)} variant="ghost">
                          Open saved view
                        </ButtonLink>
                      ) : (
                        <form action={saveViewAction}>
                          <input type="hidden" name="type" value="tasks" />
                          <input type="hidden" name="name" value={recommendedView.baseName} />
                          <input type="hidden" name="filter" value={recommendedView.filter} />
                          <input type="hidden" name="sort" value={recommendedView.sort} />
                          <input type="hidden" name="redirect_to" value={recommendedView.href} />
                          <Button type="submit" variant="ghost">
                            Create saved view
                          </Button>
                        </form>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Saved Views</p>
            {savedViews.length === 0 ? (
              <p className="text-sm text-slate-600">No saved task views yet.</p>
            ) : (
              <div className="space-y-3">
                {supportsOwnershipFields ? (
                  <>
                    <div className="space-y-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">My Views</p>
                      {personalViews.length === 0 ? (
                        <p className="text-sm text-slate-600">No personal task views yet.</p>
                      ) : (
                        personalViews.map(renderSavedView)
                      )}
                    </div>
                    <div className="space-y-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Team Views</p>
                      {teamViews.length === 0 ? (
                        <p className="text-sm text-slate-600">No team task views yet.</p>
                      ) : (
                        teamViews.map(renderSavedView)
                      )}
                    </div>
                  </>
                ) : (
                  teamViews.map(renderSavedView)
                )}
              </div>
            )}
            {savedViews.length > 0 && (!supportsPriorityFields || !supportsOwnershipFields) ? (
              <div className="space-y-1">
                {!supportsPriorityFields ? (
                  <p className="text-xs text-slate-500">
                    Pinning and default views are unavailable until the latest `saved_views` migration is applied.
                  </p>
                ) : null}
                {!supportsOwnershipFields ? (
                  <p className="text-xs text-slate-500">
                    Personal and team view grouping are unavailable until the saved view ownership migration is applied.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
        <div className="grid gap-4 rounded-[1.75rem] border border-slate-200 bg-sand/50 p-4 md:grid-cols-[1.2fr_0.8fr]">
          <form action="/tasks" className="space-y-3 md:col-span-2">
            <input type="hidden" name="filter" value={filter} />
            <input type="hidden" name="sort" value={sort} />
            {projectId ? <input type="hidden" name="projectId" value={projectId} /> : null}
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Search</p>
            <div className="flex flex-col gap-3 md:flex-row">
              <Input
                name="q"
                defaultValue={query}
                placeholder="Search by task title or description"
                className="bg-white"
              />
              <Button type="submit" variant="secondary">
                Search
              </Button>
            </div>
          </form>
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Filter</p>
            <div className="flex flex-wrap gap-2">
              {filters.map((option) => (
                <Link
                  key={option.value}
                  href={buildTasksHref(option.value, sort, query, projectId)}
                  className={cn(
                    "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition",
                    filter === option.value
                      ? "bg-ink text-white"
                      : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
                  )}
                >
                  {option.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Sort</p>
            <div className="flex flex-wrap gap-2">
              {sorts.map((option) => (
                <Link
                  key={option.value}
                  href={buildTasksHref(filter, option.value, query, projectId)}
                  className={cn(
                    "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition",
                    sort === option.value
                      ? "bg-brand-600 text-white"
                      : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
                  )}
                >
                  {option.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
        {tasks.length === 0 ? (
          <div className="space-y-4">
            {filter === "all" && !query.trim() && !projectName ? (
              <Card className="space-y-4 border border-dashed border-brand-300 bg-brand-50/40 p-5">
                <div>
                  <p className="text-sm font-medium text-ink">
                    No tasks yet. Create one to start your Morning Ops workflow.
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    Once tasks exist, Morning Ops shows what is due today, what is overdue, and what to review first.
                    You can also save a Due Today view so the right command view is one click away.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ButtonLink href="/tasks/new" variant="secondary">
                    Create Task
                  </ButtonLink>
                  {dueTodayShortcut ? (
                    <ButtonLink href={dueTodayShortcut.href} variant="ghost">
                      {dueTodayShortcut.matchedView ? "Open saved Due Today view" : "Preview Due Today view"}
                    </ButtonLink>
                  ) : null}
                </div>
              </Card>
            ) : null}
            <EmptyState
              title={
                query.trim()
                  ? "No tasks match this search"
                  : filter === "all"
                    ? "No tasks yet"
                    : "No tasks match this filter"
              }
              description={
                query.trim()
                  ? "Try a different task title, description, filter, or sort view."
                  : filter === "all"
                    ? projectName
                      ? "No tasks match this project context yet."
                      : "Add the first task for one of your projects."
                    : "Try a different status filter or sort view."
              }
              action={
                <ButtonLink href="/tasks/new" variant="secondary">
                  Create your first task
                </ButtonLink>
              }
            />
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <Card key={task.id} className="space-y-4 border border-slate-200 bg-white/80 p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="font-serif text-2xl font-semibold text-ink">{task.title}</h2>
                      <Badge tone={priorityTone(task.priority)}>{labelize(task.priority)}</Badge>
                      <Badge tone={statusTone(task.status)}>{labelize(task.status)}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">Project: {taskProjectName(task)}</p>
                    <p className="mt-2 text-sm text-slate-600">
                      {task.description || "No description added yet."}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <ButtonLink href={`/tasks/${task.id}/edit`} variant="ghost">
                      Edit
                    </ButtonLink>
                    <Link
                      href={`/projects/${task.projectId}`}
                      className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      View Project
                    </Link>
                  </div>
                </div>
                <div className="flex flex-col gap-4 border-t border-slate-200 pt-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Due date</p>
                    <p className="mt-1 text-sm font-medium text-ink">
                      {formatDate(task.dueDate)}
                      {isOverdue(task.dueDate) && task.status !== "done" ? (
                        <span className="ml-2 text-rose-600">Overdue</span>
                      ) : null}
                    </p>
                  </div>
                  <form action={updateTaskStatusAction} className="flex flex-col gap-3 md:flex-row md:items-center">
                    <input type="hidden" name="task_id" value={task.id} />
                    <input type="hidden" name="project_id" value={task.projectId} />
                    <select
                      name="status"
                      defaultValue={task.status}
                      className="w-full rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-500 md:w-auto"
                    >
                      <option value="not_started">Not Started</option>
                      <option value="in_progress">In Progress</option>
                      <option value="blocked">Blocked</option>
                      <option value="done">Done</option>
                    </select>
                    <Button type="submit" variant="secondary">
                      Update Status
                    </Button>
                  </form>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
