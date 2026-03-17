import { Topbar } from "@/components/layout/topbar";
import { TaskForm } from "@/components/tasks/task-form";
import { ButtonLink } from "@/components/ui";
import { createTaskAction } from "@/lib/actions/crud";
import { getCurrentOrganization, getProjects } from "@/lib/data";

export default async function NewTaskPage() {
  const [{ userId }, projects] = await Promise.all([getCurrentOrganization(), getProjects()]);

  return (
    <div className="space-y-6">
      <Topbar title="New Task" subtitle="Create a task for a project in the current organization." />
      <div className="flex justify-end">
        <ButtonLink href="/tasks" variant="ghost">
          Back to Tasks
        </ButtonLink>
      </div>
      <TaskForm action={createTaskAction} submitLabel="Create task" projects={projects} currentUserId={userId} />
    </div>
  );
}
