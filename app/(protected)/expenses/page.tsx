import Link from "next/link";
import { Topbar } from "@/components/layout/topbar";
import { Badge, Button, ButtonLink, Card, EmptyState, Input } from "@/components/ui";
import { getExpensesCommandView } from "@/lib/data";
import { cn, currency, formatDate } from "@/lib/utils";

type ExpenseRow = {
  id: string;
  projectId: string;
  vendorId: string | null;
  category: string;
  amount: number;
  expenseDate: string;
  notes: string | null;
  project?: { name: string } | { name: string }[] | null;
  vendor?: { name: string } | { name: string }[] | null;
};

function relationName(value?: { name: string } | { name: string }[] | null) {
  if (Array.isArray(value)) return value[0]?.name ?? null;
  return value?.name ?? null;
}

const filters = [
  { value: "all", label: "All" },
  { value: "with_vendor", label: "With Vendor" },
  { value: "no_vendor", label: "No Vendor" },
  { value: "high_cost", label: "High Cost" },
  { value: "recent", label: "Recent" },
] as const;

const sorts = [
  { value: "newest", label: "Newest" },
  { value: "highest_amount", label: "Highest Amount" },
  { value: "oldest", label: "Oldest" },
  { value: "project_name", label: "By Project Name" },
] as const;

function buildExpensesHref(filter: string, sort: string, query: string) {
  const params = new URLSearchParams();
  if (filter !== "all") params.set("filter", filter);
  if (sort !== "newest") params.set("sort", sort);
  if (query.trim()) params.set("q", query.trim());
  const queryString = params.toString();
  return queryString ? `/expenses?${queryString}` : "/expenses";
}

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams?: Promise<{ filter?: string; sort?: string; q?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const { expenses, filter, sort, query } = await getExpensesCommandView({
    filter: params.filter,
    sort: params.sort,
    query: params.q,
  });

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
        <div className="grid gap-4 rounded-[1.75rem] border border-slate-200 bg-sand/50 p-4 md:grid-cols-[1.2fr_0.8fr]">
          <form action="/expenses" className="space-y-3 md:col-span-2">
            <input type="hidden" name="filter" value={filter} />
            <input type="hidden" name="sort" value={sort} />
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Search</p>
            <div className="flex flex-col gap-3 md:flex-row">
              <Input
                name="q"
                defaultValue={query}
                placeholder="Search by category, notes, vendor, or project"
                className="bg-white"
              />
              <Button type="submit" variant="secondary">
                Search
              </Button>
            </div>
          </form>
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Filter</p>
            <div className="flex flex-wrap gap-2">
              {filters.map((option) => (
                <Link
                  key={option.value}
                  href={buildExpensesHref(option.value, sort, query)}
                  className={cn(
                    "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition",
                    filter === option.value
                      ? "bg-ink text-white"
                      : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
                  )}
                >
                  {option.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Sort</p>
            <div className="flex flex-wrap gap-2">
              {sorts.map((option) => (
                <Link
                  key={option.value}
                  href={buildExpensesHref(filter, option.value, query)}
                  className={cn(
                    "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition",
                    sort === option.value
                      ? "bg-brand-600 text-white"
                      : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
                  )}
                >
                  {option.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
        {expenses.length === 0 ? (
          <EmptyState
            title={
              query.trim()
                ? "No expenses match this search"
                : filter === "all"
                  ? "No expenses yet"
                  : "No expenses match this filter"
            }
            description={
              query.trim()
                ? "Try a different category, notes, vendor, project, filter, or sort view."
                : filter === "all"
                  ? "Add the first expense for one of your organization's projects."
                  : "Try a different expense filter or sort view."
            }
            action={
              <ButtonLink href="/expenses/new" variant="secondary">
                Create your first expense
              </ButtonLink>
            }
          />
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
                      <p>Date: {formatDate(expense.expenseDate)}</p>
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
