"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/browser";

export function AuthProvider() {
  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      // Session refresh is handled by middleware; subscribing keeps client auth state warm.
    });

    return () => subscription.unsubscribe();
  }, []);

  return null;
}
