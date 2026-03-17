import { Button, Card, Field, Input, Textarea } from "@/components/ui";

export function FieldUpdateForm({
  projectId,
  action,
}: {
  projectId: string;
  action: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <Card className="p-6">
      <form action={action} className="space-y-5">
        <input type="hidden" name="project_id" value={projectId} />
        <Field label="Update title">
          <Input name="title" placeholder="Inspection passed for rough plumbing" required />
        </Field>
        <Field label="Description">
          <Textarea
            name="description"
            placeholder="Add what happened on site, blockers, next steps, or crew notes."
          />
        </Field>
        <div className="flex justify-end">
          <Button type="submit">Post update</Button>
        </div>
      </form>
    </Card>
  );
}
