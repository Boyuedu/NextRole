import { createLocalRepository } from "@/lib/data/local";
import { createSupabaseRepository } from "@/lib/data/supabase";
import type { TrackerRepository } from "@/lib/data/types";
import { isSupabaseConfigured, localFallbackAllowed } from "@/lib/supabase/client";

let repository: TrackerRepository | null = null;

export function getRepository(): TrackerRepository {
  if (!repository) {
    if (isSupabaseConfigured()) {
      repository = createSupabaseRepository();
    } else if (localFallbackAllowed()) {
      repository = createLocalRepository();
    } else {
      throw new Error(
        "Supabase is required in production. localStorage fallback is disabled."
      );
    }
  }
  return repository;
}

export function resetRepository() {
  repository = null;
}
