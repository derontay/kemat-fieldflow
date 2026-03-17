import Link from "next/link";
import { Topbar } from "@/components/layout/topbar";
import { Badge, Button, ButtonLink, Card } from "@/components/ui";
import { updateTaskStatusAction } from "@/lib/actions/crud";
import { getTasks } from "@/lib/data";
import { formatDate, isOverdue } from "@/lib/utils";

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  status: "not_started" | "in_progress" | "blocked" | "done";
  project_id: string;
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

function projectName(task: TaskRow) {
  if (Array.isArray(task.project)) return task.project[0]?.name ?? "Unknown project";
  return task.project?.name ?? "Unknown project";
}

export default async function TasksPage() {
  const tasks = (await getTasks()) as TaskRow[];

  return (
    <div className="space-y-6">
      <Topbar
        title="Tasks"
        subtitle="Track work items across the current organization and keep status updates tied to their projects."
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
        {tasks.length === 0 ? (
          <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-sand/65 p-8 text-center">
            <h2 className="font-serif text-2xl font-semibold text-ink">No tasks yet</h2>
            <p className="mt-3 text-sm text-slate-600">
              Add the first task for one of your projects.
            </p>
            <div className="mt-5">
              <ButtonLink href="/tasks/new" variant="secondary">
                Create your first task
              </ButtonLink>
            </div>
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
                    <p className="mt-2 text-sm text-slate-600">Project: {projectName(task)}</p>
                    <p className="mt-2 text-sm text-slate-600">
                      {task.description || "No description added yet."}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <ButtonLink href={`/tasks/${task.id}/edit`} variant="ghost">
                      Edit
                    </ButtonLink>
                    <Link
                      href={`/projects/${task.project_id}`}
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
                      {formatDate(task.due_date)}
                      {isOverdue(task.due_date) && task.status !== "done" ? (
                        <span className="ml-2 text-rose-600">Overdue</span>
                      ) : null}
                    </p>
                  </div>
                  <form action={updateTaskStatusAction} className="flex flex-col gap-3 md:flex-row md:items-center">
                    <input type="hidden" name="task_id" value={task.id} />
                    <input type="hidden" name="project_id" value={task.project_id} />
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
