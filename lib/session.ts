import { cookies } from "next/headers";

const SESSION_COOKIE = "ff_phase1_session";

export async function hasSession() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value === "active";
}

export async function setSession() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "active", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
