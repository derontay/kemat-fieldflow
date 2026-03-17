import { Topbar } from "@/components/layout/topbar";
import { TemplateNameForm } from "@/components/templates/template-name-form";
import { ButtonLink } from "@/components/ui";
import { createTemplateAction } from "@/lib/actions/templates";

export default function NewTemplatePage() {
  return (
    <div className="space-y-6">
      <Topbar
        title="New Template"
        subtitle="Create a reusable task template for the current organization."
      />
      <div className="flex justify-end">
        <ButtonLink href="/templates" variant="ghost">
          Back to Templates
        </ButtonLink>
      </div>
      <TemplateNameForm action={createTemplateAction} submitLabel="Create template" />
    </div>
  );
}
