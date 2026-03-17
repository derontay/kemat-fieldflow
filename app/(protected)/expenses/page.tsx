import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default function ExpensesPage() {
  return (
    <PlaceholderPage
      title="Expenses"
      subtitle="A scaffold for cost tracking and receipts."
      description="Phase 2 will connect expenses, categories, vendors, and variance reporting to persistent data."
      highlights={["Expense ledger shell", "Receipt upload placeholder", "Category summary panel"]}
    />
  );
}
