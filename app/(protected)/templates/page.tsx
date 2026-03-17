import Link from "next/link";
import { Topbar } from "@/components/layout/topbar";
import { Badge, ButtonLink, Card, EmptyState } from "@/components/ui";
import { getTaskTemplateDetail, getTaskTemplates } from "@/lib/data";

async function getTemplateCount(templateId: string) {
  const detail = await getTaskTemplateDetail(templateId);
  return detail.items.length;
}

export default async function TemplatesPage() {
  const templates = await getTaskTemplates();
  const counts = await Promise.all(templates.map((template) => getTemplateCount(template.id)));

  return (
    <div className="space-y-6">
      <Topbar
        title="Templates"
        subtitle="Create reusable task lists for the current organization and apply them to projects."
      />
      <Card className="space-y-6 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-brand-700">Task Templates</p>
            <h1 className="mt-2 font-serif text-4xl font-semibold text-ink">Reusable Task Sets</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-600">
              Build repeatable task sequences once, then apply them to any project in your workspace.
            </p>
          </div>
          <ButtonLink href="/templates/new">New Template</ButtonLink>
        </div>
        {templates.length === 0 ? (
          <EmptyState
            title="No templates yet"
            description="Start by creating the first task template for your organization."
            action={
              <ButtonLink href="/templates/new" variant="secondary">
                Create your first template
              </ButtonLink>
            }
          />
        ) : (
          <div className="space-y-4">
            {templates.map((template, index) => (
              <Link
                key={template.id}
                href={`/templates/${template.id}`}
                className="block rounded-[1.75rem] border border-slate-200 bg-white/80 p-5 transition hover:border-brand-300 hover:shadow-panel"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="font-serif text-2xl font-semibold text-ink">{template.name}</h2>
                    <p className="mt-2 text-sm text-slate-600">
                      Open this template to rename it, add reusable tasks, or remove items.
                    </p>
                  </div>
                  <Badge>{counts[index]} task{counts[index] === 1 ? "" : "s"}</Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
