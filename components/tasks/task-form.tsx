import { taskPriorities, taskStatuses } from "@/lib/config";
import { Button, Card, Field, Input, Select, Textarea } from "@/components/ui";
import { type Project, type Task } from "@/types/database";

type TaskFormValues = Pick<
  Task,
  "title" | "description" | "due_date" | "priority" | "status" | "project_id" | "assignee_id"
>;

const defaultValues: TaskFormValues = {
  title: "",
  description: "",
  due_date: null,
  priority: "medium",
  status: "not_started",
  project_id: "",
  assignee_id: null,
};

export function TaskForm({
  action,
  submitLabel,
  task,
  projects,
  currentUserId,
}: {
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  task?: Task | null;
  projects: Project[];
  currentUserId: string;
}) {
  const values = task ?? defaultValues;
  const assigneeValue =
    values.assignee_id && values.assignee_id !== currentUserId ? values.assignee_id : values.assignee_id ?? "";

  return (
    <Card className="p-6">
      <form action={action} className="space-y-5">
        {task ? <input type="hidden" name="task_id" value={task.id} /> : null}
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Title">
            <Input name="title" defaultValue={values.title} placeholder="Schedule final inspection" required />
          </Field>
          <Field label="Project">
            <Select name="project_id" defaultValue={values.project_id} required>
              <option value="" disabled>
                Select a project
              </option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Priority">
            <Select name="priority" defaultValue={values.priority}>
              {taskPriorities.map((priority) => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select name="status" defaultValue={values.status}>
              {taskStatuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Due date">
            <Input name="due_date" type="date" defaultValue={values.due_date ?? ""} />
          </Field>
          <Field label="Assignee">
            <Select name="assignee_id" defaultValue={assigneeValue}>
              <option value="">Unassigned</option>
              <option value={currentUserId}>You</option>
              {values.assignee_id && values.assignee_id !== currentUserId ? (
                <option value={values.assignee_id}>Existing assignee</option>
              ) : null}
            </Select>
          </Field>
        </div>
        <Field label="Description">
          <Textarea
            name="description"
            defaultValue={values.description ?? ""}
            placeholder="Capture scope, blockers, or handoff notes."
          />
        </Field>
        <div className="flex justify-end">
          <Button type="submit">{submitLabel}</Button>
        </div>
      </form>
    </Card>
  );
}
