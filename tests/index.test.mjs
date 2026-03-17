import assert from "node:assert/strict";
import { cn, currency, formatDate, formatDateTime, isOverdue } from "../lib/utils.ts";
import { getAppUrl, getSupabaseAnonKey, getSupabaseUrl } from "../lib/env.ts";

function run(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

run("currency falls back to zero for nullish values", () => {
  assert.equal(currency(null), "$0");
  assert.equal(currency(undefined), "$0");
});

run("format helpers return stable fallback text for empty values", () => {
  assert.equal(formatDate(null), "Not set");
  assert.equal(formatDateTime(undefined), "Not set");
});

run("cn merges overlapping Tailwind classes", () => {
  assert.equal(cn("px-2", "px-4", "text-sm"), "px-4 text-sm");
});

run("isOverdue distinguishes past and future dates", () => {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  assert.equal(isOverdue(yesterday.toISOString()), true);
  assert.equal(isOverdue(tomorrow.toISOString()), false);
  assert.equal(isOverdue(null), false);
});

run("getAppUrl trims trailing slashes", () => {
  const previous = process.env.NEXT_PUBLIC_APP_URL;
  process.env.NEXT_PUBLIC_APP_URL = "https://kemat-fieldflow.vercel.app///";

  try {
    assert.equal(getAppUrl(), "https://kemat-fieldflow.vercel.app");
  } finally {
    if (previous === undefined) {
      delete process.env.NEXT_PUBLIC_APP_URL;
    } else {
      process.env.NEXT_PUBLIC_APP_URL = previous;
    }
  }
});

run("Supabase env getters read direct public env values", () => {
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const previousKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";

  try {
    assert.equal(getSupabaseUrl(), "https://example.supabase.co");
    assert.equal(getSupabaseAnonKey(), "anon-key");
  } finally {
    if (previousUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
    }

    if (previousKey === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = previousKey;
    }
  }
});

console.log("All launch scaffold checks passed.");
