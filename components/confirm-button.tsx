"use client";

import { Button } from "@/components/ui";

export function ConfirmButton({
  message,
  children,
  variant = "danger",
}: {
  message: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  return (
    <Button
      type="submit"
      variant={variant}
      onClick={(event) => {
        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
    >
      {children}
    </Button>
  );
}
