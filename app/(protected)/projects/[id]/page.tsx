import { Topbar } from "@/components/layout/topbar";
import { ButtonLink, Card, Badge } from "@/components/ui";
import { getProjectDetail } from "@/lib/data";
import { currency, formatDate } from "@/lib/utils";

function statusTone(status: string): "default" | "success" | "warning" {
  if (status === "active") return "success";
  if (status === "on_hold") return "warning";
  return "default";
}

function statusLabel(status: string) {
  return status.replace("_", " ");
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProjectDetail(id);

  return (
    <div className="space-y-6">
      <Topbar title={project.name} subtitle="Project detail for the current organization." />
      <div className="flex flex-wrap gap-3">
        <ButtonLink href="/projects" variant="ghost">
          Back to Projects
        </ButtonLink>
        <ButtonLink href={`/projects/${project.id}/edit`} variant="secondary">
          Edit Project
        </ButtonLink>
      </div>
      <Card className="space-y-6 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone={statusTone(project.status)}>{statusLabel(project.status)}</Badge>
          <p className="text-sm text-slate-600">{project.address || "No address added yet"}</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Start date</p>
            <p className="mt-2 font-medium text-ink">{formatDate(project.start_date)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Target completion</p>
            <p className="mt-2 font-medium text-ink">{formatDate(project.target_completion_date)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Planned budget</p>
            <p className="mt-2 font-medium text-ink">{currency(project.planned_budget)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Actual spend</p>
            <p className="mt-2 font-medium text-ink">{currency(project.actual_spend)}</p>
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Notes</p>
          <div className="mt-3 rounded-[1.5rem] bg-sand/70 p-5 text-sm text-slate-700">
            {project.notes || "No notes added yet."}
          </div>
        </div>
      </Card>
    </div>
  );
}
