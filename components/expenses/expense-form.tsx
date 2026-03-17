import { Button, Card, Field, Input, Select, Textarea } from "@/components/ui";
import { type Expense, type Project, type Vendor } from "@/types/database";

type ExpenseFormValues = Pick<
  Expense,
  "project_id" | "vendor_id" | "category" | "amount" | "expense_date" | "notes"
>;

const defaultValues: ExpenseFormValues = {
  project_id: "",
  vendor_id: null,
  category: "",
  amount: 0,
  expense_date: new Date().toISOString().slice(0, 10),
  notes: "",
};

export function ExpenseForm({
  action,
  submitLabel,
  expense,
  projects,
  vendors,
}: {
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  expense?: Expense | null;
  projects: Project[];
  vendors: Vendor[];
}) {
  const values = expense ?? defaultValues;

  return (
    <Card className="p-6">
      <form action={action} className="space-y-5">
        {expense ? <input type="hidden" name="expense_id" value={expense.id} /> : null}
        <div className="grid gap-5 md:grid-cols-2">
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
          <Field label="Vendor">
            <Select name="vendor_id" defaultValue={values.vendor_id ?? ""}>
              <option value="">No vendor</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Category">
            <Input name="category" defaultValue={values.category} placeholder="Materials" required />
          </Field>
          <Field label="Amount">
            <Input
              name="amount"
              type="number"
              min="0"
              step="0.01"
              defaultValue={String(values.amount ?? 0)}
              required
            />
          </Field>
          <Field label="Expense date">
            <Input name="expense_date" type="date" defaultValue={values.expense_date} required />
          </Field>
        </div>
        <Field label="Notes">
          <Textarea
            name="notes"
            defaultValue={values.notes ?? ""}
            placeholder="Receipt context, payment notes, or budget details."
          />
        </Field>
        <div className="flex justify-end">
          <Button type="submit">{submitLabel}</Button>
        </div>
      </form>
    </Card>
  );
}
