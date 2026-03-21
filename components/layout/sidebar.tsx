"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bookmark,
  BookTemplate,
  Building2,
  CreditCard,
  FolderKanban,
  LayoutDashboard,
  Receipt,
  SquareCheckBig,
  Truck,
  Users,
} from "lucide-react";
import { APP_NAME } from "@/lib/config";
import { cn } from "@/lib/utils";
import type { PinnedSavedViewLink } from "@/types/database";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/tasks", label: "Tasks", icon: SquareCheckBig },
  { href: "/templates", label: "Templates", icon: BookTemplate },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/vendors", label: "Vendors", icon: Truck },
  { href: "/team", label: "Team", icon: Users },
  { href: "/settings", label: "Settings", icon: CreditCard },
];

export function Sidebar({
  organizationName,
  organizationRole,
  pinnedSavedViews,
}: {
  organizationName: string;
  organizationRole: "owner" | "admin" | "member";
  pinnedSavedViews: PinnedSavedViewLink[];
}) {
  const pathname = usePathname();
  const roleLabel =
    organizationRole === "owner"
      ? "Owner"
      : organizationRole === "admin"
        ? "Admin"
        : "Member";

  return (
    <aside className="rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-panel backdrop-blur">
      <div className="mb-8">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-white">
          <Building2 className="h-6 w-6" />
        </div>
        <p className="mt-4 font-serif text-2xl font-semibold">{APP_NAME}</p>
        <p className="mt-1 text-sm text-slate-500">{organizationName}</p>
        <div className="mt-3 inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium uppercase tracking-[0.15em] text-slate-600">
          {roleLabel}
        </div>
      </div>
      <nav className="space-y-2">
        {links.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                isActive
                  ? "bg-ink text-white shadow-sm"
                  : "text-slate-600 hover:bg-sand hover:text-ink",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      {pinnedSavedViews.length > 0 ? (
        <div className="mt-8 border-t border-slate-200 pt-6">
          <div className="mb-3 flex items-center gap-2 px-1">
            <Bookmark className="h-4 w-4 text-brand-700" />
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Morning Ops</p>
          </div>
          <div className="space-y-2">
            {pinnedSavedViews.map((view) => {
              const isActive = pathname === view.href.split("?")[0];

              return (
                <Link
                  key={view.id}
                  href={view.href}
                  className={cn(
                    "block rounded-2xl border px-4 py-3 transition",
                    view.is_default
                      ? "border-brand-200 bg-brand-50/70"
                      : "border-slate-200 bg-slate-50/80 hover:bg-sand",
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        isActive ? "text-ink" : "text-slate-700",
                      )}
                    >
                      {view.name}
                    </p>
                    <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium uppercase tracking-[0.15em] text-slate-500">
                      {view.type === "tasks" ? "Task" : "Expense"}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="text-xs uppercase tracking-[0.15em] text-slate-500">
                      {view.scope === "personal" ? "My View" : "Team View"}
                    </span>
                    {view.is_default ? (
                      <span className="text-xs uppercase tracking-[0.15em] text-brand-700">Default</span>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
    </aside>
  );
}
