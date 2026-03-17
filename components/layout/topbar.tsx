import { logoutAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui";

export function Topbar({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-panel backdrop-blur md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-brand-700">Protected Workspace</p>
        <h2 className="mt-1 font-serif text-3xl font-semibold text-ink">{title}</h2>
        {subtitle ? <p className="mt-2 text-sm text-slate-600">{subtitle}</p> : null}
      </div>
      <form action={logoutAction}>
        <Button variant="ghost" type="submit">
          Sign out
        </Button>
      </form>
    </div>
  );
}
