import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default function DashboardPage() {
  return (
    <PlaceholderPage
      title="Dashboard"
      subtitle="A read-only overview shell for project health, budget signals, and team activity."
      description="Phase 2 will connect these surfaces to real project metrics, alerts, and recent field updates."
      highlights={["Portfolio snapshot cards", "Upcoming deadlines feed", "Budget risk summary"]}
    />
  );
}
