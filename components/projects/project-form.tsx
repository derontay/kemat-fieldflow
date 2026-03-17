import { projectStatuses } from "@/lib/config";
import { Button, Card, Field, Input, Select, Textarea } from "@/components/ui";
import { type Project } from "@/types/database";

type ProjectFormValues = Pick<
  Project,
  "name" | "address" | "status" | "start_date" | "target_completion_date" | "planned_budget" | "actual_spend" | "notes"
>;

const defaultValues: ProjectFormValues = {
  name: "",
  address: "",
  status: "planning",
  start_date: null,
  target_completion_date: null,
  planned_budget: 0,
  actual_spend: 0,
  notes: "",
};

export function ProjectForm({
  action,
  submitLabel,
  project,
}: {
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  project?: Project | null;
}) {
  const values = project ?? defaultValues;

  return (
    <Card className="p-6">
      <form action={action} className="space-y-5">
        {project ? <input type="hidden" name="project_id" value={project.id} /> : null}
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Project name">
            <Input name="name" defaultValue={values.name} placeholder="Maple Street Renovation" required />
          </Field>
          <Field label="Status">
            <Select name="status" defaultValue={values.status}>
              {projectStatuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Address">
            <Input name="address" defaultValue={values.address ?? ""} placeholder="123 Main St, Atlanta, GA" />
          </Field>
          <Field label="Start date">
            <Input name="start_date" type="date" defaultValue={values.start_date ?? ""} />
          </Field>
          <Field label="Target completion date">
            <Input
              name="target_completion_date"
              type="date"
              defaultValue={values.target_completion_date ?? ""}
            />
          </Field>
          <Field label="Planned budget">
            <Input
              name="planned_budget"
              type="number"
              min="0"
              step="0.01"
              defaultValue={String(values.planned_budget ?? 0)}
            />
          </Field>
          <Field label="Actual spend">
            <Input
              name="actual_spend"
              type="number"
              min="0"
              step="0.01"
              defaultValue={String(values.actual_spend ?? 0)}
            />
          </Field>
        </div>
        <Field label="Notes">
          <Textarea
            name="notes"
            defaultValue={values.notes ?? ""}
            placeholder="Scope, site notes, access details, or budget context."
          />
        </Field>
        <div className="flex justify-end">
          <Button type="submit">{submitLabel}</Button>
        </div>
      </form>
    </Card>
  );
}
