import { Topbar } from "@/components/layout/topbar";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { ButtonLink } from "@/components/ui";
import { createExpenseAction } from "@/lib/actions/crud";
import { getProjects, getVendors } from "@/lib/data";

export default async function NewExpensePage() {
  const [projects, vendors] = await Promise.all([getProjects(), getVendors()]);

  return (
    <div className="space-y-6">
      <Topbar title="New Expense" subtitle="Create an expense for a project in the current organization." />
      <div className="flex justify-end">
        <ButtonLink href="/expenses" variant="ghost">
          Back to Expenses
        </ButtonLink>
      </div>
      <ExpenseForm action={createExpenseAction} submitLabel="Create expense" projects={projects} vendors={vendors} />
    </div>
  );
}
