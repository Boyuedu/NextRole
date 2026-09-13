import type { StorageMode } from "@/lib/data/types";
import {
  deleteResumeFile as deleteLocalResume,
  getResumeFile as getLocalResume,
  listResumeFilePaths,
  putResumeFile as putLocalResume,
} from "@/lib/storage/resume-files";
import { RESUME_BUCKET } from "@/lib/snapshots";
import { getSupabaseClient } from "@/lib/supabase/client";
import { requireUserId } from "@/lib/supabase/session";

function logStorageError(operation: string, error: unknown) {
  if (process.env.NODE_ENV === "production") return;
  const details = error as { message?: string; statusCode?: string | number };
  console.error("Supabase Storage error", {
    operation,
    message: details.message ?? String(error),
    statusCode: details.statusCode,
  });
}

function resumeUploadBody(file: Blob, contentType: string) {
  return new Blob([file], { type: contentType || file.type || "application/octet-stream" });
}

export async function storeResumeFile(
  mode: StorageMode,
  path: string,
  file: Blob,
  contentType: string
) {
  if (mode === "local") {
    await putLocalResume(path, file);
    return;
  }
  const userId = await requireUserId();
  if (!path.startsWith(`${userId}/`)) {
    throw new Error("Invalid resume storage path.");
  }
  const supabase = getSupabaseClient();
  const { error } = await supabase.storage.from(RESUME_BUCKET).upload(
    path,
    resumeUploadBody(file, contentType),
    {
      contentType,
      upsert: false,
    }
  );
  if (error) {
    logStorageError("upload", error);
    throw error;
  }
}

export async function fetchResumeFile(mode: StorageMode, path: string) {
  if (mode === "local") {
    const blob = await getLocalResume(path);
    if (!blob) throw new Error("Resume file not found.");
    return blob;
  }
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.storage.from(RESUME_BUCKET).download(path);
  if (error || !data) {
    if (error) logStorageError("download", error);
    throw error ?? new Error("Resume file not found.");
  }
  return data;
}

export async function removeResumeFile(mode: StorageMode, path: string | null | undefined) {
  if (!path) return;
  try {
    if (mode === "local") {
      await deleteLocalResume(path);
      return;
    }
    const supabase = getSupabaseClient();
    const { error } = await supabase.storage.from(RESUME_BUCKET).remove([path]);
    if (error) {
      logStorageError("remove", error);
      throw error;
    }
  } catch (error) {
    console.error(error);
  }
}

export async function removeResumeFilesForApplication(
  mode: StorageMode,
  applicationId: string
) {
  try {
    const paths = (await listStoredResumePaths(mode)).filter((path) =>
      resumePathMatchesApplication(path, applicationId)
    );
    await Promise.all(paths.map((path) => removeResumeFile(mode, path)));
  } catch (error) {
    logStorageError("list", error);
    console.error(error);
  }
}

export async function pruneResumeFiles(mode: StorageMode, keepPaths: string[]) {
  try {
    const keep = new Set(keepPaths);
    const stored = await listStoredResumePaths(mode);
    await Promise.all(
      stored
        .filter((path) => !keep.has(path))
        .map((path) => removeResumeFile(mode, path))
    );
  } catch (error) {
    logStorageError("list", error);
    console.error(error);
  }
}

async function listStoredResumePaths(mode: StorageMode) {
  if (mode === "local") {
    return listResumeFilePaths();
  }
  return listSupabaseResumePaths();
}

function resumePathMatchesApplication(path: string, applicationId: string) {
  const parts = path.split("/").filter(Boolean);
  return parts[0] === applicationId || parts[1] === applicationId;
}

async function listSupabaseResumePaths(prefix = "") {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.storage.from(RESUME_BUCKET).list(prefix, {
    limit: 1000,
  });
  if (error) throw error;
  const paths: string[] = [];
  for (const item of data ?? []) {
    const full = prefix ? `${prefix}/${item.name}` : item.name;
    if (!item.id) {
      paths.push(...(await listSupabaseResumePaths(full)));
      continue;
    }
    paths.push(full);
  }
  return paths;
}
