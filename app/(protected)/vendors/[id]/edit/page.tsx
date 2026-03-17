import { Topbar } from "@/components/layout/topbar";
import { VendorForm } from "@/components/vendors/vendor-form";
import { Button, ButtonLink, Card } from "@/components/ui";
import { deleteVendorAction, updateVendorAction } from "@/lib/actions/crud";
import { getVendorDetail } from "@/lib/data";

export default async function EditVendorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vendor = await getVendorDetail(id);

  return (
    <div className="space-y-6">
      <Topbar title={`Edit ${vendor.name}`} subtitle="Update vendor details for the current organization." />
      <div className="flex flex-wrap justify-between gap-3">
        <ButtonLink href="/vendors" variant="ghost">
          Back to Vendors
        </ButtonLink>
        <Card className="p-2">
          <form action={deleteVendorAction}>
            <input type="hidden" name="vendor_id" value={vendor.id} />
            <Button type="submit" variant="danger">
              Delete Vendor
            </Button>
          </form>
        </Card>
      </div>
      <VendorForm action={updateVendorAction} submitLabel="Save changes" vendor={vendor} />
    </div>
  );
}
