import { Card } from "@/components/ui";

export default function ProtectedLoading() {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="h-4 w-32 rounded-full bg-slate-200" />
        <div className="mt-4 h-10 w-64 rounded-full bg-slate-200" />
        <div className="mt-3 h-4 w-full max-w-2xl rounded-full bg-slate-200" />
      </Card>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="space-y-4 p-6">
            <div className="h-4 w-24 rounded-full bg-slate-200" />
            <div className="h-8 w-32 rounded-full bg-slate-200" />
            <div className="h-4 w-full rounded-full bg-slate-200" />
            <div className="h-4 w-4/5 rounded-full bg-slate-200" />
          </Card>
        ))}
      </div>
    </div>
  );
}
