import { getSupabaseClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export async function requireUser(): Promise<User> {
  const supabase = getSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error("Not signed in.");
  return user;
}

export async function requireUserId() {
  return (await requireUser()).id;
}
