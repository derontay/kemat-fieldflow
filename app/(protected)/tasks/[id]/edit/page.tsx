import { Topbar } from "@/components/layout/topbar";
import { TaskForm } from "@/components/tasks/task-form";
import { ConfirmButton } from "@/components/confirm-button";
import { ButtonLink, Card } from "@/components/ui";
import { deleteTaskAction, updateTaskAction } from "@/lib/actions/crud";
import { getCurrentOrganization, getProjects, getTaskDetail } from "@/lib/data";

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [{ userId }, projects, task] = await Promise.all([
    getCurrentOrganization(),
    getProjects(),
    getTaskDetail(id),
  ]);

  return (
    <div className="space-y-6">
      <Topbar title={`Edit ${task.title}`} subtitle="Update task details and status for the current organization." />
      <div className="flex flex-wrap justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/tasks" variant="ghost">
            Back to Tasks
          </ButtonLink>
          <ButtonLink href={`/projects/${task.project_id}`} variant="ghost">
            Back to Project
          </ButtonLink>
        </div>
        <Card className="p-2">
          <form action={deleteTaskAction}>
            <input type="hidden" name="task_id" value={task.id} />
            <input type="hidden" name="project_id" value={task.project_id} />
            <ConfirmButton message="Delete this task?">
              Delete Task
            </ConfirmButton>
          </form>
        </Card>
      </div>
      <TaskForm
        action={updateTaskAction}
        submitLabel="Save changes"
        task={task}
        projects={projects}
        currentUserId={userId}
      />
    </div>
  );
}
