import { Button, Card, Field, Input } from "@/components/ui";
import { type TaskTemplate } from "@/types/database";

export function TemplateNameForm({
  action,
  submitLabel,
  template,
}: {
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  template?: TaskTemplate | null;
}) {
  return (
    <Card className="p-6">
      <form action={action} className="space-y-5">
        {template ? <input type="hidden" name="template_id" value={template.id} /> : null}
        <Field label="Template name">
          <Input
            name="name"
            defaultValue={template?.name ?? ""}
            placeholder="Punch List Closeout"
            required
          />
        </Field>
        <div className="flex justify-end">
          <Button type="submit">{submitLabel}</Button>
        </div>
      </form>
    </Card>
  );
}
