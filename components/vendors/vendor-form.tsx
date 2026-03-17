import { Button, Card, Field, Input, Textarea } from "@/components/ui";
import { type Vendor } from "@/types/database";

type VendorFormValues = Pick<Vendor, "name" | "trade" | "phone" | "email" | "notes">;

const defaultValues: VendorFormValues = {
  name: "",
  trade: "",
  phone: "",
  email: "",
  notes: "",
};

export function VendorForm({
  action,
  submitLabel,
  vendor,
}: {
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  vendor?: Vendor | null;
}) {
  const values = vendor ?? defaultValues;

  return (
    <Card className="p-6">
      <form action={action} className="space-y-5">
        {vendor ? <input type="hidden" name="vendor_id" value={vendor.id} /> : null}
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Name">
            <Input name="name" defaultValue={values.name} placeholder="Northside Plumbing" required />
          </Field>
          <Field label="Trade">
            <Input name="trade" defaultValue={values.trade ?? ""} placeholder="Plumbing" />
          </Field>
          <Field label="Phone">
            <Input name="phone" defaultValue={values.phone ?? ""} placeholder="(555) 123-4567" />
          </Field>
          <Field label="Email">
            <Input name="email" type="email" defaultValue={values.email ?? ""} placeholder="crew@vendor.com" />
          </Field>
        </div>
        <Field label="Notes">
          <Textarea
            name="notes"
            defaultValue={values.notes ?? ""}
            placeholder="Preferred scope, responsiveness, payment notes, or contact details."
          />
        </Field>
        <div className="flex justify-end">
          <Button type="submit">{submitLabel}</Button>
        </div>
      </form>
    </Card>
  );
}
