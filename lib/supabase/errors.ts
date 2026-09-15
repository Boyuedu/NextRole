export function logSupabaseError(operation: string, error: unknown) {
  const details = error as {
    code?: string;
    message?: string;
    details?: string;
    hint?: string;
  };
  console.error("Supabase error", {
    operation,
    code: details.code,
    message: details.message ?? String(error),
    details: details.details,
    hint: details.hint,
  });
}
