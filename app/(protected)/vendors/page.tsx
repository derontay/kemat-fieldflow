import { Topbar } from "@/components/layout/topbar";
import { Badge, ButtonLink, Card, EmptyState } from "@/components/ui";
import { getVendorIntelligence } from "@/lib/data";
import { currency, formatDate } from "@/lib/utils";

export default async function VendorsPage() {
  const vendors = await getVendorIntelligence();

  return (
    <div className="space-y-6">
      <Topbar
        title="Vendors"
        subtitle="Manage subcontractors and suppliers for the current organization."
      />
      <Card className="space-y-6 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-brand-700">Vendor Directory</p>
            <h1 className="mt-2 font-serif text-4xl font-semibold text-ink">Current Vendors</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-600">
              Keep vendor contact details and trade information scoped to your workspace.
            </p>
          </div>
          <ButtonLink href="/vendors/new">New Vendor</ButtonLink>
        </div>
        {vendors.length === 0 ? (
          <EmptyState
            title="No vendors yet"
            description="Add the first vendor for your current organization."
            action={
              <ButtonLink href="/vendors/new" variant="secondary">
                Create your first vendor
              </ButtonLink>
            }
          />
        ) : (
          <div className="space-y-4">
            {vendors.map((vendor) => (
              <Card key={vendor.id} className="space-y-4 border border-slate-200 bg-white/80 p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="font-serif text-2xl font-semibold text-ink">{vendor.name}</h2>
                      {vendor.trade ? <Badge>{vendor.trade}</Badge> : null}
                    </div>
                    <div className="mt-3 space-y-1 text-sm text-slate-600">
                      <p>{vendor.phone || "No phone added"}</p>
                      <p>{vendor.email || "No email added"}</p>
                    </div>
                  </div>
                  <ButtonLink href={`/vendors/${vendor.id}/edit`} variant="ghost">
                    Edit
                  </ButtonLink>
                </div>
                <div className="grid gap-3 border-t border-slate-200 pt-4 text-sm text-slate-600 md:grid-cols-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Linked expenses</p>
                    <p className="mt-1 font-medium text-ink">{vendor.totalLinkedExpenses}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Total spend</p>
                    <p className="mt-1 font-medium text-ink">{currency(vendor.totalSpend)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Projects worked on</p>
                    <p className="mt-1 font-medium text-ink">{vendor.projectCount}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Last expense</p>
                    <p className="mt-1 font-medium text-ink">{formatDate(vendor.lastExpenseDate)}</p>
                  </div>
                </div>
                <div className="rounded-[1.5rem] bg-sand/70 p-4 text-sm text-slate-700">
                  {vendor.notes || "No notes added yet."}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
