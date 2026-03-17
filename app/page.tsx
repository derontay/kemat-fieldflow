import { redirect } from "next/navigation";
import { hasSession } from "@/lib/session";

export default async function HomePage() {
  const isAuthenticated = await hasSession();
  redirect(isAuthenticated ? "/dashboard" : "/login");
}
