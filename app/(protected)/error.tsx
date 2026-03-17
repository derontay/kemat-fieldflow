"use client";

import { ButtonLink, Card } from "@/components/ui";

export default function ProtectedError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Card className="space-y-5 p-6">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-rose-600">Load Error</p>
        <h1 className="mt-2 font-serif text-3xl font-semibold text-ink">This page could not be loaded.</h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-600">
          Try reloading the page. If the problem continues, the current data request may be failing or the database shape may be out of sync.
        </p>
        <p className="mt-3 text-sm text-slate-500">{error.message}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center justify-center rounded-full bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Try Again
        </button>
        <ButtonLink href="/dashboard" variant="ghost">
          Back to Dashboard
        </ButtonLink>
      </div>
    </Card>
  );
}
