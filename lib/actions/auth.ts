"use server";

import { redirect } from "next/navigation";
import { getAppUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

function cleanValue(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

export async function authAction(formData: FormData) {
  const supabase = await createClient();
  const mode = String(formData.get("mode") || "login");
  const email = cleanValue(formData.get("email")).toLowerCase();
  const password = String(formData.get("password") || "");
  const name = cleanValue(formData.get("name"));

  if (mode === "signup") {
    if (!email || !password) {
      redirect("/signup?message=Email%20and%20password%20are%20required.");
    }

    const appUrl = getAppUrl();
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
    if (!email) {
      redirect("/reset-password?message=Enter%20the%20email%20address%20on%20your%20account.");
    }

    const appUrl = getAppUrl();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${appUrl}/auth/callback?next=${encodeURIComponent("/reset-password?mode=update")}`,
    });

    if (error) {
      redirect(`/reset-password?message=${encodeURIComponent(error.message)}`);
    }

    redirect("/login?message=Password%20reset%20email%20sent.%20Check%20your%20inbox.");
  }

  if (!email || !password) {
    redirect("/login?message=Enter%20your%20email%20address%20and%20password.");
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect("/login?message=We%20could%20not%20sign%20you%20in.%20Check%20your%20email%20and%20password.");
  }

  redirect("/dashboard");
}

export async function signInWithGoogleAction() {
  const supabase = await createClient();
  const appUrl = getAppUrl();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${appUrl}/auth/callback?next=${encodeURIComponent("/dashboard")}`,
    },
  });

  if (error || !data.url) {
    redirect("/login?message=Google%20sign-in%20is%20currently%20unavailable.");
  }

  redirect(data.url);
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
