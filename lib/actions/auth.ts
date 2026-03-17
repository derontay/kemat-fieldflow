"use server";

import { redirect } from "next/navigation";
import { clearSession, setSession } from "@/lib/session";

export async function authAction(formData: FormData) {
  const mode = String(formData.get("mode") || "login");

  if (mode === "reset-password") {
    redirect("/login?message=Password%20reset%20will%20be%20wired%20in%20during%20Phase%202.");
  }

  await setSession();
  redirect("/dashboard");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}
