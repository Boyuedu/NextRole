import { migrateSnapshot } from "@/lib/data/migrate";
import type { TrackerSnapshot } from "@/lib/data/types";
import { todayInputValue } from "@/lib/format";
import type { Locale } from "@/locales";
import type { Application, ApplicationEvent, ApplicationSnapshot, Category, Company, Tag } from "@/types";

export const BACKUP_VERSION = 1;

export type ImportMode = "merge" | "replace";

export interface TrackerBackup {
  version: number;
  exportedAt: string;
  locale?: Locale;
  applications: Application[];
  categories: Category[];
  companies: Company[];
  tags: Tag[];
  events: ApplicationEvent[];
  applicationSnapshots: ApplicationSnapshot[];
  classificationSeeded?: boolean;
  companiesSeeded?: boolean;
}

export class BackupError extends Error {
  constructor(message = "invalid-backup") {
    super(message);
    this.name = "BackupError";
  }
}

export function createBackup(
  snapshot: TrackerSnapshot,
  locale: Locale
): TrackerBackup {
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    locale,
    applications: snapshot.applications,
    categories: snapshot.categories,
    companies: snapshot.companies,
    tags: snapshot.tags,
    events: snapshot.events,
    applicationSnapshots: snapshot.applicationSnapshots,
    classificationSeeded: true,
    companiesSeeded: true,
  };
}

export function backupFileName(extension: "json" | "csv") {
  const date = todayInputValue();
  return extension === "json"
    ? `nextrole-backup-${date}.json`
    : `nextrole-applications-${date}.csv`;
}

export function parseBackup(raw: unknown): TrackerBackup {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new BackupError();
  }
  const data = raw as Record<string, unknown>;
  if (typeof data.version !== "number" || data.version !== BACKUP_VERSION) {
    throw new BackupError();
  }
  if (!Array.isArray(data.applications)) {
    throw new BackupError();
  }
  if (
    data.applications.some(
      (item) =>
        !item ||
        typeof item !== "object" ||
        typeof (item as Application).id !== "string" ||
        typeof (item as Application).company !== "string" ||
        typeof (item as Application).position !== "string"
    )
  ) {
    throw new BackupError();
  }

  const snapshot = migrateSnapshot({
    applications: data.applications,
    categories: Array.isArray(data.categories) ? data.categories : [],
    companies: Array.isArray(data.companies) ? data.companies : [],
    tags: Array.isArray(data.tags) ? data.tags : [],
    events: Array.isArray(data.events) ? data.events : [],
    applicationSnapshots: Array.isArray(data.applicationSnapshots)
      ? data.applicationSnapshots
      : [],
    classificationSeeded: data.classificationSeeded === true,
    companiesSeeded: data.companiesSeeded === true,
  });

  return {
    version: BACKUP_VERSION,
    exportedAt:
      typeof data.exportedAt === "string"
        ? data.exportedAt
        : new Date().toISOString(),
    locale: data.locale === "zh" ? "zh" : data.locale === "en" ? "en" : undefined,
    ...snapshot,
  };
}

export function mergeSnapshots(
  current: TrackerSnapshot,
  incoming: TrackerSnapshot
): TrackerSnapshot {
  const categories = mergeById(current.categories, incoming.categories);
  const companies = mergeById(current.companies, incoming.companies);
  const tags = mergeById(current.tags, incoming.tags);
  const applications = mergeById(
    current.applications,
    incoming.applications
  ).map((application) => ({
    ...application,
    companyId: companies.some((company) => company.id === application.companyId)
      ? application.companyId
      : null,
    regionId: categories.some((category) => category.id === application.regionId)
      ? application.regionId
      : null,
    functionId: categories.some(
      (category) => category.id === application.functionId
    )
      ? application.functionId
      : null,
    tagIds: application.tagIds.filter((tagId) =>
      tags.some((tag) => tag.id === tagId)
    ),
  }));
  const applicationIds = new Set(applications.map((application) => application.id));
  const events = mergeById(current.events, incoming.events).filter((event) =>
    applicationIds.has(event.applicationId)
  );
  const applicationSnapshots = mergeSnapshotsByApplication(
    current.applicationSnapshots,
    incoming.applicationSnapshots,
    applicationIds
  );

  return migrateSnapshot({
    applications,
    categories,
    companies,
    tags,
    events,
    applicationSnapshots,
    classificationSeeded: true,
    companiesSeeded: true,
  });
}

export function toCsv(snapshot: TrackerSnapshot) {
  const headers = [
    "Company",
    "Position",
    "Location",
    "Region",
    "Function",
    "Status",
    "Stage",
    "Job Type",
    "Applied Date",
    "Job URL",
    "Job ID",
    "Resume Used",
    "Source",
    "Referral Code",
    "Tags",
    "Notes",
    "Archived",
    "Created At",
    "Updated At",
  ];
  const tagNames = new Map(snapshot.tags.map((tag) => [tag.id, tag.name]));
  const rows = snapshot.applications.map((application) => [
    application.company,
    application.position,
    application.location ?? "",
    application.region ?? "",
    application.functionCategory ?? "",
    application.status,
    application.stage,
    application.jobType ?? "",
    application.appliedDate ?? "",
    application.jobUrl ?? "",
    application.jobId ?? "",
    application.resumeUsed ?? "",
    application.source ?? "",
    application.referralCode ?? "",
    application.tagIds
      .map((id) => tagNames.get(id))
      .filter(Boolean)
      .join("; "),
    application.notes ?? "",
    application.archived ? "true" : "false",
    application.createdAt,
    application.updatedAt,
  ]);
  return `\uFEFF${[headers, ...rows].map(csvLine).join("\r\n")}\r\n`;
}

function mergeById<T extends { id: string }>(current: T[], incoming: T[]) {
  const map = new Map(current.map((item) => [item.id, item]));
  for (const item of incoming) {
    map.set(item.id, item);
  }
  return [...map.values()];
}

function mergeSnapshotsByApplication(
  current: ApplicationSnapshot[],
  incoming: ApplicationSnapshot[],
  applicationIds: Set<string>
) {
  const map = new Map<string, ApplicationSnapshot>();
  for (const snapshot of current) {
    if (applicationIds.has(snapshot.applicationId)) {
      map.set(snapshot.applicationId, snapshot);
    }
  }
  for (const snapshot of incoming) {
    if (applicationIds.has(snapshot.applicationId)) {
      map.set(snapshot.applicationId, snapshot);
    }
  }
  return [...map.values()];
}

function csvLine(values: string[]) {
  return values.map(csvCell).join(",");
}

function csvCell(value: string) {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}
