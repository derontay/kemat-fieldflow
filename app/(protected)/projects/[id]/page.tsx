import { FieldUpdateForm } from "@/components/projects/field-update-form";
import { ConfirmButton } from "@/components/confirm-button";
import { Topbar } from "@/components/layout/topbar";
import { Badge, ButtonLink, Card, EmptyState } from "@/components/ui";
import { createFieldUpdateAction, deleteFieldUpdateAction } from "@/lib/actions/crud";
import { getProjectActivity, getProjectDetail } from "@/lib/data";
import { currency, formatDate, formatDateTime } from "@/lib/utils";

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
  const [project, activity] = await Promise.all([getProjectDetail(id), getProjectActivity(id)]);

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
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.25em] text-brand-700">New Activity</p>
          <FieldUpdateForm projectId={project.id} action={createFieldUpdateAction} />
        </div>
        <Card className="space-y-6 p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-brand-700">Project Activity</p>
            <h2 className="mt-2 font-serif text-3xl font-semibold text-ink">Field Updates</h2>
            <p className="mt-2 text-sm text-slate-600">
              Most recent project activity appears first.
            </p>
          </div>
          {activity.updates.length === 0 ? (
            <EmptyState
              title="No field updates yet"
              description="Post the first update for this project using the form on the left."
            />
          ) : (
            <div className="space-y-5">
              {activity.updates.map((update) => (
                <div key={update.id} className="relative border-l border-slate-300 pl-6">
                  <div className="absolute -left-[7px] top-2 h-3 w-3 rounded-full bg-brand-600" />
                  <div className="rounded-[1.5rem] border border-slate-200 bg-white/85 p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h3 className="font-serif text-2xl font-semibold text-ink">{update.title}</h3>
                        <p className="mt-2 text-sm text-slate-700">
                          {update.description || "No description added."}
                        </p>
                      </div>
                      <div className="flex flex-col items-start gap-3 md:items-end">
                        <div className="text-sm text-slate-500">
                          <p>{formatDateTime(update.created_at)}</p>
                          <p className="mt-1">
                            {update.created_by === activity.currentUserId
                              ? "You"
                              : update.created_by
                                ? "Workspace member"
                                : "Unknown user"}
                          </p>
                        </div>
                        <form action={deleteFieldUpdateAction}>
                          <input type="hidden" name="update_id" value={update.id} />
                          <input type="hidden" name="project_id" value={project.id} />
                          <ConfirmButton message="Delete this field update?" variant="ghost">
                            Delete
                          </ConfirmButton>
                        </form>
                      </div>
                    </div>
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
