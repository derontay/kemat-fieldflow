"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, CreditCard, FolderKanban, LayoutDashboard, Receipt, SquareCheckBig, Truck } from "lucide-react";
import { APP_NAME } from "@/lib/config";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/tasks", label: "Tasks", icon: SquareCheckBig },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/vendors", label: "Vendors", icon: Truck },
  { href: "/settings", label: "Settings", icon: CreditCard },
];

export function Sidebar({ organizationName }: { organizationName: string }) {
  const pathname = usePathname();

  return (
    <aside className="rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-panel backdrop-blur">
      <div className="mb-8">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-white">
          <Building2 className="h-6 w-6" />
        </div>
        <p className="mt-4 font-serif text-2xl font-semibold">{APP_NAME}</p>
        <p className="mt-1 text-sm text-slate-500">{organizationName}</p>
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
    </aside>
  );
}
