import { Topbar } from "@/components/layout/topbar";
import { ProjectForm } from "@/components/projects/project-form";
import { Button, ButtonLink, Card } from "@/components/ui";
import { deleteProjectAction, updateProjectAction } from "@/lib/actions/crud";
import { getProjectDetail } from "@/lib/data";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProjectDetail(id);

  return (
    <div className="space-y-6">
      <Topbar title={`Edit ${project.name}`} subtitle="Update project details for the current organization." />
      <div className="flex flex-wrap justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <ButtonLink href={`/projects/${project.id}`} variant="ghost">
            Back to Detail
          </ButtonLink>
          <ButtonLink href="/projects" variant="ghost">
            Back to Projects
          </ButtonLink>
        </div>
        <Card className="p-2">
          <form action={deleteProjectAction}>
            <input type="hidden" name="project_id" value={project.id} />
            <Button type="submit" variant="danger">
              Delete Project
            </Button>
          </form>
        </Card>
      </div>
      <ProjectForm action={updateProjectAction} submitLabel="Save changes" project={project} />
    </div>
  );
}
