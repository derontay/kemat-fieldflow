import { taskPriorities } from "@/lib/config";
import { Button, Card, Field, Input, Select, Textarea } from "@/components/ui";

export function TemplateItemForm({
  templateId,
  action,
}: {
  templateId: string;
  action: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <Card className="p-6">
      <form action={action} className="space-y-5">
        <input type="hidden" name="template_id" value={templateId} />
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Task title">
            <Input name="title" placeholder="Schedule final inspection" required />
          </Field>
          <Field label="Priority">
            <Select name="priority" defaultValue="medium">
              {taskPriorities.map((priority) => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Order">
            <Input name="sort_order" type="number" min="0" step="1" defaultValue="0" required />
          </Field>
        </div>
        <Field label="Description">
          <Textarea
            name="description"
            placeholder="Add the reusable task details, dependencies, or crew notes."
          />
        </Field>
        <div className="flex justify-end">
          <Button type="submit">Add template task</Button>
        </div>
      </form>
    </Card>
  );
}
