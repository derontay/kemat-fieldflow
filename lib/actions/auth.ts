"use server";

import { redirect } from "next/navigation";
import { getAppUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

function cleanValue(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function getSafeNext(formData: FormData) {
  const next = cleanValue(formData.get("next"));
  return next.startsWith("/") ? next : "/dashboard";
}

export async function authAction(formData: FormData) {
  const supabase = await createClient();
  const mode = String(formData.get("mode") || "login");
  const email = cleanValue(formData.get("email")).toLowerCase();
  const password = String(formData.get("password") || "");
  const name = cleanValue(formData.get("name"));
  const next = getSafeNext(formData);

  if (mode === "signup") {
    if (!email || !password) {
      redirect(`/signup?message=Email%20and%20password%20are%20required.&next=${encodeURIComponent(next)}`);
    }

    const appUrl = getAppUrl();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${appUrl}/auth/callback?next=${encodeURIComponent(next)}`,
        data: name ? { full_name: name } : undefined,
      },
    });

    if (error) {
      redirect(`/signup?message=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`);
    }

    if (data.session) {
      redirect(next);
    }

    redirect(`/login?message=Check%20your%20email%20to%20confirm%20your%20account.&next=${encodeURIComponent(next)}`);
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
    redirect(`/login?message=Enter%20your%20email%20address%20and%20password.&next=${encodeURIComponent(next)}`);
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(
      `/login?message=We%20could%20not%20sign%20you%20in.%20Check%20your%20email%20and%20password.&next=${encodeURIComponent(next)}`,
    );
  }

  redirect(next);
}

export async function signInWithGoogleAction(formData: FormData) {
  const supabase = await createClient();
  const appUrl = getAppUrl();
  const next = getSafeNext(formData);
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${appUrl}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error || !data.url) {
    redirect(`/login?message=Google%20sign-in%20is%20currently%20unavailable.&next=${encodeURIComponent(next)}`);
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
