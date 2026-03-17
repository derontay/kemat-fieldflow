import Link from "next/link";
import { Topbar } from "@/components/layout/topbar";
import { Badge, ButtonLink, Card, EmptyState } from "@/components/ui";
import { getProjects } from "@/lib/data";
import { currency, formatDate } from "@/lib/utils";

function statusTone(status: string): "default" | "success" | "warning" {
  if (status === "active") return "success";
  if (status === "on_hold") return "warning";
  return "default";
}

function statusLabel(status: string) {
  return status.replace("_", " ");
}

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div className="space-y-6">
      <Topbar
        title="Projects"
        subtitle="Manage the jobs for your current organization. All project records here are scoped to your workspace."
      />
      <Card className="space-y-6 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-brand-700">Project Registry</p>
            <h1 className="mt-2 font-serif text-4xl font-semibold text-ink">Current Projects</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-600">
              Create, review, and maintain projects without leaving the protected app shell.
            </p>
          </div>
          <ButtonLink href="/projects/new">New Project</ButtonLink>
        </div>
        {projects.length === 0 ? (
          <EmptyState
            title="No projects yet"
            description="Start by creating the first project for your organization."
            action={
              <ButtonLink href="/projects/new" variant="secondary">
                Create your first project
              </ButtonLink>
            }
          />
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="block rounded-[1.75rem] border border-slate-200 bg-white/80 p-5 transition hover:border-brand-300 hover:shadow-panel"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="font-serif text-2xl font-semibold text-ink">{project.name}</h2>
                      <Badge tone={statusTone(project.status)}>{statusLabel(project.status)}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      {project.address || "No address added yet"}
                    </p>
                  </div>
                  <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Start</p>
                      <p className="mt-1 font-medium text-ink">{formatDate(project.start_date)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Target</p>
                      <p className="mt-1 font-medium text-ink">{formatDate(project.target_completion_date)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Budget</p>
                      <p className="mt-1 font-medium text-ink">{currency(project.planned_budget)}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
