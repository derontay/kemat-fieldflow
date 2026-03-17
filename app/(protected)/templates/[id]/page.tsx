import { ConfirmButton } from "@/components/confirm-button";
import { Topbar } from "@/components/layout/topbar";
import { TemplateItemForm } from "@/components/templates/template-item-form";
import { TemplateNameForm } from "@/components/templates/template-name-form";
import { Badge, ButtonLink, Card, EmptyState } from "@/components/ui";
import {
  addTemplateItemAction,
  deleteTemplateItemAction,
  updateTemplateAction,
} from "@/lib/actions/templates";
import { getTaskTemplateDetail } from "@/lib/data";

function priorityTone(priority: string): "default" | "warning" | "danger" {
  if (priority === "urgent") return "danger";
  if (priority === "high") return "warning";
  return "default";
}

function labelize(value: string) {
  return value.replace("_", " ");
}

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { template, items } = await getTaskTemplateDetail(id);

  return (
    <div className="space-y-6">
      <Topbar
        title={template.name}
        subtitle="Manage reusable template tasks for the current organization."
      />
      <div className="flex justify-end">
        <ButtonLink href="/templates" variant="ghost">
          Back to Templates
        </ButtonLink>
      </div>
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.25em] text-brand-700">Template Name</p>
            <TemplateNameForm
              action={updateTemplateAction}
              submitLabel="Update template"
              template={template}
            />
          </div>
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.25em] text-brand-700">Add Template Task</p>
            <TemplateItemForm templateId={template.id} action={addTemplateItemAction} />
          </div>
        </div>
        <Card className="space-y-6 p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-brand-700">Template Items</p>
            <h2 className="mt-2 font-serif text-3xl font-semibold text-ink">Reusable Tasks</h2>
            <p className="mt-2 text-sm text-slate-600">
              Apply this template from a project page to create these tasks in order.
            </p>
          </div>
          {items.length === 0 ? (
            <EmptyState
              title="No template tasks yet"
              description="Add the first reusable task using the form on the left."
            />
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="rounded-[1.5rem] border border-slate-200 bg-white/85 p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="font-serif text-2xl font-semibold text-ink">{item.title}</h3>
                        <Badge tone={priorityTone(item.priority)}>{labelize(item.priority)}</Badge>
                        <Badge>Order {item.sort_order}</Badge>
                      </div>
                      <p className="mt-2 text-sm text-slate-700">
                        {item.description || "No description added."}
                      </p>
                    </div>
                    <form action={deleteTemplateItemAction}>
                      <input type="hidden" name="template_id" value={template.id} />
                      <input type="hidden" name="item_id" value={item.id} />
                      <ConfirmButton message="Delete this template task?" variant="ghost">
                        Delete
                      </ConfirmButton>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
