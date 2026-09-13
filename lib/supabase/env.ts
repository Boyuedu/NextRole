function readEnv(value: string | undefined) {
  return value?.trim() ? value.trim() : undefined;
}

function getSupabaseUrl() {
  return readEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

function getSupabasePublishableKey() {
  return (
    readEnv(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ??
    readEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}

export function isSupabaseConfigured() {
  return Boolean(getSupabaseUrl() && getSupabasePublishableKey());
}

export function isProductionRuntime() {
  return process.env.NODE_ENV === "production";
}

export function localFallbackAllowed() {
  return !isProductionRuntime() && !isSupabaseConfigured();
}

export function getSupabaseEnv() {
  const url = getSupabaseUrl();
  const publishableKey = getSupabasePublishableKey();
  if (!url || !publishableKey) {
    throw new Error("Supabase environment variables are not configured.");
  }
  return { url, publishableKey };
}
