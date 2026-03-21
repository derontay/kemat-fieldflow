import { redirect } from "next/navigation";
import { getSuperUserEmails } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  return { supabase, user };
}

export async function requireAdmin() {
  const { getCurrentOrganization } = await import("@/lib/data");
  const context = await getCurrentOrganization();

  if (context.role !== "owner" && context.role !== "admin") {
    redirect("/dashboard");
  }

  return context;
}

export async function getSuperUserContext() {
  const { supabase, user } = await requireUser();
  const currentUserEmail = user.email?.toLowerCase() ?? null;
  const isSuperUser = currentUserEmail ? getSuperUserEmails().includes(currentUserEmail) : false;

  return {
    supabase,
    user,
    currentUserEmail,
    isSuperUser,
  };
}
