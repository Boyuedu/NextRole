import { createId, nowIso } from "@/lib/data/helpers";
import { emptyToNull } from "@/lib/format";
import type { ApplicationSnapshot, ApplicationSnapshotInput } from "@/types";

export const RESUME_BUCKET = "application-resumes";
export const MAX_RESUME_BYTES = 10 * 1024 * 1024;

const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx"] as const;
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export type ResumeFileError = "type" | "size";

export function snapshotText(value: string) {
  return value.trim().length > 0 ? value : null;
}

export function snapshotFieldsFromInput(input: Pick<
  ApplicationSnapshotInput,
  "jobDescription" | "referralCode"
>) {
  return {
    jobDescription: snapshotText(input.jobDescription),
    referralCode: emptyToNull(input.referralCode),
  };
}

export function normalizeSnapshot(
  snapshot: Partial<ApplicationSnapshot> & { applicationId: string }
): ApplicationSnapshot {
  return {
    id: snapshot.id ?? createId(),
    applicationId: snapshot.applicationId,
    jobDescription: snapshot.jobDescription ?? null,
    referralCode: snapshot.referralCode ?? null,
    resumeFileName: snapshot.resumeFileName ?? null,
    resumeStoragePath: snapshot.resumeStoragePath ?? null,
    resumeMimeType: snapshot.resumeMimeType ?? null,
    resumeFileSize:
      typeof snapshot.resumeFileSize === "number" ? snapshot.resumeFileSize : null,
    createdAt: snapshot.createdAt ?? nowIso(),
    updatedAt: snapshot.updatedAt ?? nowIso(),
  };
}

export function parseSnapshots(
  raw: unknown,
  applicationIds: Set<string>
): ApplicationSnapshot[] {
  if (!Array.isArray(raw)) return [];
  const byApplication = new Map<string, ApplicationSnapshot>();
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const snapshot = item as Partial<ApplicationSnapshot>;
    if (typeof snapshot.applicationId !== "string") continue;
    if (!applicationIds.has(snapshot.applicationId)) continue;
    byApplication.set(
      snapshot.applicationId,
      normalizeSnapshot({
        ...snapshot,
        applicationId: snapshot.applicationId,
        id: typeof snapshot.id === "string" ? snapshot.id : undefined,
      })
    );
  }
  return [...byApplication.values()];
}

export function resumeAccept() {
  return ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
}

export function resumeFileError(file: File): ResumeFileError | null {
  if (file.size > MAX_RESUME_BYTES) return "size";
  if (!isAllowedResumeFile(file)) return "type";
  return null;
}

function isAllowedResumeFile(file: File) {
  const name = file.name.toLowerCase();
  const extension = ALLOWED_EXTENSIONS.find((item) => name.endsWith(item));
  if (!extension) return false;
  if (!file.type || file.type === "application/octet-stream") return true;
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(file.type);
}

export function resumeMimeType(file: File) {
  if (file.type && file.type !== "application/octet-stream") return file.type;
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return "application/pdf";
  if (name.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (name.endsWith(".doc")) return "application/msword";
  return "application/octet-stream";
}

export function resumeFileExtension(fileName: string) {
  const lower = fileName.trim().toLowerCase();
  const match = ALLOWED_EXTENSIONS.find((extension) => lower.endsWith(extension));
  return (match ?? ".pdf").slice(1);
}

export function generatedResumeFileName(fileName: string) {
  return `${crypto.randomUUID()}.${resumeFileExtension(fileName)}`;
}

export function buildResumeStoragePath(
  userId: string,
  applicationId: string,
  fileName: string
) {
  if (!userId) {
    throw new Error("Not signed in.");
  }
  return `${userId}/${applicationId}/${generatedResumeFileName(fileName)}`;
}

export function keepResumePaths(snapshots: ApplicationSnapshot[]) {
  return snapshots
    .map((snapshot) => snapshot.resumeStoragePath)
    .filter((path): path is string => Boolean(path));
}
