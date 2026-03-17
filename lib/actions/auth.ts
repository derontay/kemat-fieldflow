"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function authAction(formData: FormData) {
  const supabase = await createClient();
  const mode = String(formData.get("mode") || "login");
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const name = String(formData.get("name") || "").trim();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!appUrl) {
    redirect("/login?message=NEXT_PUBLIC_APP_URL%20is%20not%20configured.");
  }

  if (mode === "signup") {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${appUrl}/auth/callback`,
        data: name ? { full_name: name } : undefined,
      },
    });

    if (error) {
      redirect(`/signup?message=${encodeURIComponent(error.message)}`);
    }

    if (data.session) {
      redirect("/dashboard");
    }

    redirect("/login?message=Check%20your%20email%20to%20confirm%20your%20account.");
  }

  if (mode === "reset-password") {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${appUrl}/auth/callback?next=${encodeURIComponent("/reset-password?mode=update")}`,
    });

    if (error) {
      redirect(`/reset-password?message=${encodeURIComponent(error.message)}`);
    }

    redirect("/login?message=Password%20reset%20email%20sent.%20Check%20your%20inbox.");
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?message=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard");
}

export async function updatePasswordAction(formData: FormData) {
  const supabase = await createClient();
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (password !== confirmPassword) {
    redirect("/reset-password?mode=update&message=Passwords%20do%20not%20match.");
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(`/reset-password?mode=update&message=${encodeURIComponent(error.message)}`);
  }

  await supabase.auth.signOut();
  redirect("/login?message=Password%20updated.%20Sign%20in%20with%20your%20new%20password.");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
