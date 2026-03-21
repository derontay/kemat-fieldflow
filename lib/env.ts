function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

let hasLoggedSupabaseServerEnv = false;

function maskSupabaseUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.host;

    if (host.length <= 12) {
      return `${url.protocol}//${host}`;
    }

    return `${url.protocol}//${host.slice(0, 6)}...${host.slice(-8)}`;
  } catch {
    return "[invalid-supabase-url]";
  }
}

export function getAppUrl() {
  const value = process.env.NEXT_PUBLIC_APP_URL;

  if (!value) {
    throw new Error("Missing required environment variable: NEXT_PUBLIC_APP_URL");
  }

  return trimTrailingSlash(value);
}

export function getSupabaseUrl() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!value) {
    throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL");
  }

  return value;
}

export function getSupabaseAnonKey() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!value) {
    throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return value;
}

export function getSuperUserEmails() {
  const configured = (process.env.SUPERUSER_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  const defaults = ["derontay@tricoreva.com"];
  return Array.from(new Set([...defaults, ...configured]));
}

export function logSupabaseServerEnvOnce() {
  if (typeof window !== "undefined" || hasLoggedSupabaseServerEnv) {
    return;
  }

  hasLoggedSupabaseServerEnv = true;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    console.warn("[env] NEXT_PUBLIC_SUPABASE_URL is missing on the server.");
    return;
  }

  console.info("[env] Server Supabase URL configured.", {
    supabaseUrl: maskSupabaseUrl(supabaseUrl),
  });
}
