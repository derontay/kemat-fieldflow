import { getCurrentOrganization, getPinnedSavedViewLinks } from "@/lib/data";
import { Sidebar } from "@/components/layout/sidebar";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [{ organization }, pinnedSavedViews] = await Promise.all([
    getCurrentOrganization(),
    getPinnedSavedViewLinks(),
  ]);

  return (
    <main className="app-shell min-h-screen p-4 md:p-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[280px_1fr]">
        <Sidebar organizationName={organization.name} pinnedSavedViews={pinnedSavedViews.views} />
        <div>{children}</div>
      </div>
    </main>
  );
}
