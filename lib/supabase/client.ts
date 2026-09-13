"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/supabase/env";

export { isSupabaseConfigured, localFallbackAllowed } from "@/lib/supabase/env";

let client: SupabaseClient | null = null;

export function getSupabaseClient() {
  if (!client) {
    const { url, publishableKey } = getSupabaseEnv();
    client = createBrowserClient(url, publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return client;
}
