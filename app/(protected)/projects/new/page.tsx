import { Topbar } from "@/components/layout/topbar";
import { ProjectForm } from "@/components/projects/project-form";
import { ButtonLink } from "@/components/ui";
import { createProjectAction } from "@/lib/actions/crud";

export default function NewProjectPage() {
  return (
    <div className="space-y-6">
      <Topbar title="New Project" subtitle="Create a project inside the current organization workspace." />
      <div className="flex justify-end">
        <ButtonLink href="/projects" variant="ghost">
          Back to Projects
        </ButtonLink>
      </div>
      <ProjectForm action={createProjectAction} submitLabel="Create project" />
    </div>
  );
}
