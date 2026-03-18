import Link from "next/link";
import { ConfirmButton } from "@/components/confirm-button";
import { Topbar } from "@/components/layout/topbar";
import { Badge, Button, ButtonLink, Card, EmptyState, Input } from "@/components/ui";
import {
  deleteSavedViewAction,
  pinSavedViewAction,
  renameSavedViewAction,
  saveViewAction,
  setDefaultSavedViewAction,
  unpinSavedViewAction,
} from "@/lib/actions/views";
import { getExpenseSavedViewSummary, getExpensesCommandView } from "@/lib/data";
import { cn, currency, formatDate } from "@/lib/utils";
import type { SavedView } from "@/types/database";

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

function buildExpensesHref(
  filter: string,
  sort: string,
  query: string,
  projectId?: string | null,
  vendorId?: string | null,
  category?: string | null,
) {
  const params = new URLSearchParams();
  if (filter !== "all") params.set("filter", filter);
  if (sort !== "newest") params.set("sort", sort);
  if (query.trim()) params.set("q", query.trim());
  if (projectId) params.set("projectId", projectId);
  if (vendorId) params.set("vendorId", vendorId);
  if (category) params.set("category", category);
  const queryString = params.toString();
  return queryString ? `/expenses?${queryString}` : "/expenses";
}

function savedViewHref(view: SavedView) {
  const state = view.query_state ?? {};
  return buildExpensesHref(
    state.filter ?? "all",
    state.sort ?? "newest",
    state.q ?? "",
    state.projectId ?? null,
    state.vendorId ?? null,
    state.category ?? null,
  );
}

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams?: Promise<{ filter?: string; sort?: string; q?: string; projectId?: string; vendorId?: string; category?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const [{ expenses, filter, sort, query, projectId, projectName, vendorId, vendorName, category }, expenseSavedViewSummary] =
    await Promise.all([
      getExpensesCommandView({
        filter: params.filter,
        sort: params.sort,
        query: params.q,
        projectId: params.projectId,
        vendorId: params.vendorId,
        category: params.category,
      }),
      getExpenseSavedViewSummary(),
    ]);
  const { views: savedViews, supportsPriorityFields, shortcuts: recommendedViews } = expenseSavedViewSummary;
  const currentHref = buildExpensesHref(filter, sort, query, projectId, vendorId, category);
  const defaultView = supportsPriorityFields ? savedViews.find((view) => view.is_default) : undefined;
  const defaultHref = defaultView ? savedViewHref(defaultView) : null;
  const isDefaultViewActive = Boolean(defaultHref && defaultHref === currentHref);

  return (
    <div className="space-y-6">
      <Topbar
        title="Expenses"
        subtitle={
          projectName || vendorName || category
            ? `Expense command view for ${[projectName, vendorName, category].filter(Boolean).join(" | ")}.`
            : "Track project spending for the current organization and link entries to projects and vendors."
        }
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
        {projectName || vendorName || category ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4">
            <div className="space-y-2">
              {projectName ? (
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Active Project Context</p>
                  <p className="mt-2 font-medium text-ink">{projectName}</p>
                </div>
              ) : null}
              {vendorName ? (
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Active Vendor Context</p>
                  <p className="mt-2 font-medium text-ink">{vendorName}</p>
                </div>
              ) : null}
              {category ? (
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Active Category Context</p>
                  <p className="mt-2 font-medium text-ink">{category}</p>
                </div>
              ) : null}
            </div>
            <ButtonLink href="/expenses" variant="ghost">
              Clear Context
            </ButtonLink>
          </div>
        ) : null}
        {defaultView ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-brand-200 bg-brand-50/70 p-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-brand-700">
                {isDefaultViewActive ? "Default View Active" : "Default View"}
              </p>
              <p className="mt-2 font-medium text-ink">{defaultView.name}</p>
              <p className="mt-1 text-sm text-slate-600">
                {isDefaultViewActive
                  ? "You are currently working from the default expense command view."
                  : "This saved view is marked as the default starting point for expenses."}
              </p>
            </div>
            {!isDefaultViewActive ? (
              <ButtonLink href={defaultHref ?? "/expenses"} variant="ghost">
                Open Default View
              </ButtonLink>
            ) : null}
          </div>
        ) : null}
        <div className="grid gap-4 rounded-[1.75rem] border border-slate-200 bg-white/75 p-4 md:grid-cols-[1.1fr_0.9fr]">
          <form action={saveViewAction} className="space-y-3">
            <input type="hidden" name="type" value="expenses" />
            <input type="hidden" name="filter" value={filter} />
            <input type="hidden" name="sort" value={sort} />
            <input type="hidden" name="q" value={query} />
            {projectId ? <input type="hidden" name="projectId" value={projectId} /> : null}
            {vendorId ? <input type="hidden" name="vendorId" value={vendorId} /> : null}
            {category ? <input type="hidden" name="category" value={category} /> : null}
            <input type="hidden" name="redirect_to" value={currentHref} />
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Save View</p>
            <div className="flex flex-col gap-3 md:flex-row">
              <Input name="name" placeholder="Name this expense view" className="bg-white" />
              <Button type="submit" variant="secondary">
                Save View
              </Button>
            </div>
          </form>
          <div className="space-y-3">
            <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/80 p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Morning Ops Recommended Views</p>
              <div className="mt-3 space-y-3">
                {recommendedViews.map((recommendedView) => (
                  <div key={recommendedView.key} className="rounded-[1rem] border border-slate-200 bg-white p-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-ink">{recommendedView.name}</p>
                        <p className="mt-1 text-sm text-slate-600">{recommendedView.description}</p>
                      </div>
                      {recommendedView.matchedView ? (
                        <div className="flex items-center gap-2">
                          <Badge tone="success">Saved</Badge>
                          {recommendedView.matchedView.is_pinned ? <Badge>Pinned</Badge> : null}
                          {recommendedView.matchedView.is_default ? <Badge tone="warning">Default</Badge> : null}
                        </div>
                      ) : (
                        <Badge tone="default">Recommended</Badge>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {recommendedView.matchedView ? (
                        <ButtonLink href={savedViewHref(recommendedView.matchedView)} variant="ghost">
                          Open saved view
                        </ButtonLink>
                      ) : (
                        <form action={saveViewAction}>
                          <input type="hidden" name="type" value="expenses" />
                          <input type="hidden" name="name" value={recommendedView.baseName} />
                          <input type="hidden" name="filter" value={recommendedView.filter} />
                          <input type="hidden" name="sort" value={recommendedView.sort} />
                          <input type="hidden" name="redirect_to" value={recommendedView.href} />
                          <Button type="submit" variant="ghost">
                            Create saved view
                          </Button>
                        </form>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Saved Views</p>
            {savedViews.length === 0 ? (
              <p className="text-sm text-slate-600">No saved expense views yet.</p>
            ) : (
              <div className="space-y-3">
                {savedViews.map((view) => (
                  <div
                    key={view.id}
                    className={cn(
                      "rounded-[1.25rem] border bg-white p-3",
                      view.is_default
                        ? "border-brand-300 bg-brand-50/40"
                        : view.is_pinned
                          ? "border-slate-300"
                          : "border-slate-200",
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <Link
                        href={savedViewHref(view)}
                        className="text-sm font-medium text-ink transition hover:text-brand-700"
                      >
                        {view.name}
                      </Link>
                      {supportsPriorityFields ? (
                        <div className="flex items-center gap-2">
                          {view.is_pinned ? <Badge>Pinned</Badge> : null}
                          {view.is_default ? <Badge tone="warning">Default</Badge> : null}
                        </div>
                      ) : null}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {supportsPriorityFields ? (
                        <>
                          <form action={view.is_pinned ? unpinSavedViewAction : pinSavedViewAction}>
                            <input type="hidden" name="view_id" value={view.id} />
                            <input type="hidden" name="type" value="expenses" />
                            <Button type="submit" variant="ghost">
                              {view.is_pinned ? "Unpin" : "Pin"}
                            </Button>
                          </form>
                          <form action={setDefaultSavedViewAction}>
                            <input type="hidden" name="view_id" value={view.id} />
                            <input type="hidden" name="type" value="expenses" />
                            <Button type="submit" variant="ghost">
                              {view.is_default ? "Default View" : "Set Default"}
                            </Button>
                          </form>
                        </>
                      ) : null}
                      <form action={deleteSavedViewAction}>
                        <input type="hidden" name="view_id" value={view.id} />
                        <input type="hidden" name="type" value="expenses" />
                        <ConfirmButton message="Delete this saved view?" variant="ghost">
                          Delete
                        </ConfirmButton>
                      </form>
                    </div>
                    <form action={renameSavedViewAction} className="mt-3 flex flex-col gap-2 md:flex-row">
                      <input type="hidden" name="view_id" value={view.id} />
                      <input type="hidden" name="type" value="expenses" />
                      <Input name="name" defaultValue={view.name} className="bg-white" />
                      <Button type="submit" variant="ghost">
                        Rename
                      </Button>
                    </form>
                  </div>
                ))}
              </div>
            )}
            {!supportsPriorityFields && savedViews.length > 0 ? (
              <p className="text-xs text-slate-500">
                Pinning and default views are unavailable until the latest `saved_views` migration is applied.
              </p>
            ) : null}
          </div>
        </div>
        <div className="grid gap-4 rounded-[1.75rem] border border-slate-200 bg-sand/50 p-4 md:grid-cols-[1.2fr_0.8fr]">
          <form action="/expenses" className="space-y-3 md:col-span-2">
            <input type="hidden" name="filter" value={filter} />
            <input type="hidden" name="sort" value={sort} />
            {projectId ? <input type="hidden" name="projectId" value={projectId} /> : null}
            {vendorId ? <input type="hidden" name="vendorId" value={vendorId} /> : null}
            {category ? <input type="hidden" name="category" value={category} /> : null}
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
                  href={buildExpensesHref(option.value, sort, query, projectId, vendorId, category)}
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
                  href={buildExpensesHref(filter, option.value, query, projectId, vendorId, category)}
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
                  ? projectName || vendorName || category
                    ? "No expenses match this active context yet."
                    : "Add the first expense for one of your organization's projects."
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
