import { Button, Card, EmptyState, Field, Select } from "@/components/ui";
import { type TaskTemplate } from "@/types/database";

export function ApplyTemplateForm({
  projectId,
  templates,
  action,
}: {
  projectId: string;
  templates: TaskTemplate[];
  action: (formData: FormData) => void | Promise<void>;
}) {
  if (templates.length === 0) {
    return (
      <EmptyState
        title="No templates yet"
        description="Create a task template first, then apply it here to generate project tasks."
      />
    );
  }

  return (
    <Card className="p-6">
      <form action={action} className="space-y-5">
        <input type="hidden" name="project_id" value={projectId} />
        <Field label="Task template">
          <Select name="template_id" defaultValue={templates[0]?.id} required>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </Select>
        </Field>
        <div className="flex justify-end">
          <Button type="submit">Apply template</Button>
        </div>
      </form>
    </Card>
  );
}
