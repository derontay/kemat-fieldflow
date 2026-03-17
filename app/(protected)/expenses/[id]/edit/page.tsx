import { Topbar } from "@/components/layout/topbar";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { Button, ButtonLink, Card } from "@/components/ui";
import { deleteExpenseAction, updateExpenseAction } from "@/lib/actions/crud";
import { getExpenseDetail, getProjects, getVendors } from "@/lib/data";

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [expense, projects, vendors] = await Promise.all([
    getExpenseDetail(id),
    getProjects(),
    getVendors(),
  ]);

  return (
    <div className="space-y-6">
      <Topbar title={`Edit ${expense.category}`} subtitle="Update expense details for the current organization." />
      <div className="flex flex-wrap justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/expenses" variant="ghost">
            Back to Expenses
          </ButtonLink>
          <ButtonLink href={`/projects/${expense.project_id}`} variant="ghost">
            Back to Project
          </ButtonLink>
        </div>
        <Card className="p-2">
          <form action={deleteExpenseAction}>
            <input type="hidden" name="expense_id" value={expense.id} />
            <input type="hidden" name="project_id" value={expense.project_id} />
            <Button type="submit" variant="danger">
              Delete Expense
            </Button>
          </form>
        </Card>
      </div>
      <ExpenseForm
        action={updateExpenseAction}
        submitLabel="Save changes"
        expense={expense}
        projects={projects}
        vendors={vendors}
      />
    </div>
  );
}
