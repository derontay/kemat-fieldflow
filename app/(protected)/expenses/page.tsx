import { Topbar } from "@/components/layout/topbar";
import { ButtonLink, Card, Badge } from "@/components/ui";
import { getExpenses } from "@/lib/data";
import { currency, formatDate } from "@/lib/utils";

type ExpenseRow = {
  id: string;
  project_id: string;
  vendor_id: string | null;
  category: string;
  amount: number;
  expense_date: string;
  notes: string | null;
  project?: { name: string } | { name: string }[] | null;
  vendor?: { name: string } | { name: string }[] | null;
};

function relationName(value?: { name: string } | { name: string }[] | null) {
  if (Array.isArray(value)) return value[0]?.name ?? null;
  return value?.name ?? null;
}

export default async function ExpensesPage() {
  const expenses = (await getExpenses()) as ExpenseRow[];

  return (
    <div className="space-y-6">
      <Topbar
        title="Expenses"
        subtitle="Track project spending for the current organization and link entries to projects and vendors."
      />
      <Card className="space-y-6 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-brand-700">Expense Ledger</p>
            <h1 className="mt-2 font-serif text-4xl font-semibold text-ink">Current Expenses</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-600">
              Keep expense records tied to the right projects and vendors inside your workspace.
            </p>
          </div>
          <ButtonLink href="/expenses/new">New Expense</ButtonLink>
        </div>
        {expenses.length === 0 ? (
          <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-sand/65 p-8 text-center">
            <h2 className="font-serif text-2xl font-semibold text-ink">No expenses yet</h2>
            <p className="mt-3 text-sm text-slate-600">
              Add the first expense for one of your organization's projects.
            </p>
            <div className="mt-5">
              <ButtonLink href="/expenses/new" variant="secondary">
                Create your first expense
              </ButtonLink>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {expenses.map((expense) => (
              <Card key={expense.id} className="space-y-4 border border-slate-200 bg-white/80 p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="font-serif text-2xl font-semibold text-ink">{expense.category}</h2>
                      <Badge>{currency(expense.amount)}</Badge>
                    </div>
                    <div className="mt-3 space-y-1 text-sm text-slate-600">
                      <p>Project: {relationName(expense.project) || "Unknown project"}</p>
                      <p>Vendor: {relationName(expense.vendor) || "No vendor linked"}</p>
                      <p>Date: {formatDate(expense.expense_date)}</p>
                    </div>
                  </div>
                  <ButtonLink href={`/expenses/${expense.id}/edit`} variant="ghost">
                    Edit
                  </ButtonLink>
                </div>
                <div className="rounded-[1.5rem] bg-sand/70 p-4 text-sm text-slate-700">
                  {expense.notes || "No notes added yet."}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
