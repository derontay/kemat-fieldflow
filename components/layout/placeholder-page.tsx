import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui";

export function PlaceholderPage({
  title,
  subtitle,
  description,
  highlights,
}: {
  title: string;
  subtitle: string;
  description: string;
  highlights: string[];
}) {
  return (
    <div className="space-y-6">
      <Topbar title={title} subtitle={subtitle} />
      <Card className="overflow-hidden p-0">
        <div className="border-b border-slate-200/80 px-6 py-6">
          <p className="text-xs uppercase tracking-[0.25em] text-brand-700">Placeholder Surface</p>
          <h1 className="mt-2 font-serif text-4xl font-semibold text-ink">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-600">{description}</p>
        </div>
        <div className="grid gap-4 p-6 md:grid-cols-3">
          {highlights.map((item) => (
            <div key={item} className="rounded-[1.5rem] border border-dashed border-slate-300 bg-sand/65 p-5">
              <p className="text-sm font-medium text-ink">{item}</p>
              <p className="mt-2 text-sm text-slate-600">
                Reserved for a later phase once the remaining workflows are approved.
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
