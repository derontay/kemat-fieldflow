import type { Metadata } from "next";
import "./globals.css";
import { APP_NAME } from "@/lib/config";
import { AuthProvider } from "@/components/providers/auth-provider";

export const metadata: Metadata = {
  title: APP_NAME,
  description: "Field-first project and budget tracking for builders and rehabbers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider />
        {children}
      </body>
    </html>
  );
}
