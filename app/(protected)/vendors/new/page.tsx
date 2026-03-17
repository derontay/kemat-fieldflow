import { Topbar } from "@/components/layout/topbar";
import { VendorForm } from "@/components/vendors/vendor-form";
import { ButtonLink } from "@/components/ui";
import { createVendorAction } from "@/lib/actions/crud";

export default function NewVendorPage() {
  return (
    <div className="space-y-6">
      <Topbar title="New Vendor" subtitle="Create a vendor for the current organization." />
      <div className="flex justify-end">
        <ButtonLink href="/vendors" variant="ghost">
          Back to Vendors
        </ButtonLink>
      </div>
      <VendorForm action={createVendorAction} submitLabel="Create vendor" />
    </div>
  );
}
