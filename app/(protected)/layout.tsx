import { redirect } from "next/navigation";
import { getOptionalCurrentOrganization, getPinnedSavedViewLinks } from "@/lib/data";
import { Sidebar } from "@/components/layout/sidebar";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const organizationContext = await getOptionalCurrentOrganization();

  if (!organizationContext.organization || !organizationContext.role) {
    redirect("/onboarding");
  }

  const pinnedSavedViews = await getPinnedSavedViewLinks();

  return (
    <main className="app-shell min-h-screen p-4 md:p-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[280px_1fr]">
        <Sidebar
          organizationName={organizationContext.organization.name}
          organizationRole={organizationContext.role}
          pinnedSavedViews={pinnedSavedViews.views}
        />
        <div>{children}</div>
      </div>
    </main>
  );
}
