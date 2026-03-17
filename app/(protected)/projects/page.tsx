import Link from "next/link";
import { Topbar } from "@/components/layout/topbar";
import { Badge, Button, ButtonLink, Card, EmptyState, Input } from "@/components/ui";
import { getProjectsCommandView } from "@/lib/data";
import { cn, currency, formatDate, formatDateTime } from "@/lib/utils";

function statusTone(status: string): "default" | "success" | "warning" {
  if (status === "active") return "success";
  if (status === "on_hold") return "warning";
  return "default";
}

function healthTone(status: string): "success" | "warning" | "danger" {
  if (status === "On Track") return "success";
  if (status === "At Risk") return "warning";
  return "danger";
}

function statusLabel(status: string) {
  return status.replace("_", " ");
}

const filters = ["all", "On Track", "At Risk", "Needs Attention"] as const;
const sorts = [
  { value: "newest", label: "Newest" },
  { value: "highest_spend", label: "Highest Spend" },
  { value: "most_overdue", label: "Most Overdue Tasks" },
  { value: "stalest_updates", label: "Stalest Updates" },
] as const;

function buildProjectsHref(filter: string, sort: string, query: string) {
  const params = new URLSearchParams();
  if (filter !== "all") params.set("filter", filter);
  if (sort !== "newest") params.set("sort", sort);
  if (query.trim()) params.set("q", query.trim());
  const queryString = params.toString();
  return queryString ? `/projects?${queryString}` : "/projects";
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams?: Promise<{ filter?: string; sort?: string; q?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const { projects, filter, sort, query } = await getProjectsCommandView({
    filter: params.filter,
    sort: params.sort,
    query: params.q,
  });

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
        <div className="grid gap-4 rounded-[1.75rem] border border-slate-200 bg-sand/50 p-4 md:grid-cols-[1.2fr_0.8fr]">
          <form action="/projects" className="space-y-3 md:col-span-2">
            <input type="hidden" name="filter" value={filter} />
            <input type="hidden" name="sort" value={sort} />
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Search</p>
            <div className="flex flex-col gap-3 md:flex-row">
              <Input
                name="q"
                defaultValue={query}
                placeholder="Search by project name or address"
                className="bg-white"
              />
              <Button type="submit" variant="secondary">
                Search
              </Button>
            </div>
          </form>
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Filter by Health</p>
            <div className="flex flex-wrap gap-2">
              {filters.map((option) => (
                <Link
                  key={option}
                  href={buildProjectsHref(option, sort, query)}
                  className={cn(
                    "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition",
                    filter === option
                      ? "bg-ink text-white"
                      : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
                  )}
                >
                  {option}
                </Link>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Sort</p>
            <div className="flex flex-wrap gap-2">
              {sorts.map((option) => (
                <Link
                  key={option.value}
                  href={buildProjectsHref(filter, option.value, query)}
                  className={cn(
                    "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition",
                    sort === option.value
                      ? "bg-brand-600 text-white"
                      : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
                  )}
                >
                  {option.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
        {projects.length === 0 ? (
          <EmptyState
            title={
              query.trim()
                ? "No projects match this search"
                : filter === "all"
                  ? "No projects yet"
                  : "No projects match this health filter"
            }
            description={
              query.trim()
                ? "Try a different project name, address, health filter, or sort view."
                : filter === "all"
                ? "Start by creating the first project for your organization."
                : "Try a different health filter or sort view to broaden the command list."
            }
            action={
              <ButtonLink href="/projects/new" variant="secondary">
                {filter === "all" ? "Create your first project" : "Create a new project"}
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
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="font-serif text-2xl font-semibold text-ink">{project.name}</h2>
                      <Badge tone={statusTone(project.status)}>{statusLabel(project.status)}</Badge>
                      <Badge tone={healthTone(project.healthStatus)}>{project.healthStatus}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      {project.address || "No address added yet"}
                    </p>
                  </div>
                  <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Start</p>
                      <p className="mt-1 font-medium text-ink">{formatDate(project.startDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Target</p>
                      <p className="mt-1 font-medium text-ink">{formatDate(project.targetCompletionDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Spend</p>
                      <p className="mt-1 font-medium text-ink">{currency(project.spend)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Last update</p>
                      <p className="mt-1 font-medium text-ink">{formatDateTime(project.lastUpdateAt)}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 border-t border-slate-200 pt-4 text-sm text-slate-600 md:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Overdue tasks</p>
                    <p className="mt-1 font-medium text-ink">{project.overdueTasks}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Total tasks</p>
                    <p className="mt-1 font-medium text-ink">{project.totalTasks}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Planned budget</p>
                    <p className="mt-1 font-medium text-ink">{currency(project.plannedBudget)}</p>
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
