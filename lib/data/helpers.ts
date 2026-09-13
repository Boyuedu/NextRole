import { getStatusForStage } from "@/lib/constants";
import { emptyToNull } from "@/lib/format";
import type {
  Application,
  ApplicationEvent,
  ApplicationEventInput,
  ApplicationInput,
  Category,
  Company,
} from "@/types";

export function nowIso() {
  return new Date().toISOString();
}

export function createId() {
  return crypto.randomUUID();
}

export function applicationFieldsFromInput(input: ApplicationInput) {
  return {
    company: input.company.trim(),
    companyId: emptyToNull(input.companyId),
    position: input.position.trim(),
    location: emptyToNull(input.location),
    regionId: emptyToNull(input.regionId),
    functionId: emptyToNull(input.functionId),
    tagIds: [...new Set(input.tagIds)],
    stage: input.stage.trim() || "Saved",
    status: getStatusForStage(input.stage.trim() || "Saved"),
    jobType: emptyToNull(input.jobType),
    appliedDate: emptyToNull(input.appliedDate),
    jobUrl: emptyToNull(input.jobUrl),
    jobId: emptyToNull(input.jobId),
    resumeUsed: emptyToNull(input.resumeUsed),
    source: emptyToNull(input.source),
    referralCode: emptyToNull(input.referralCode),
    notes: emptyToNull(input.notes),
  };
}

export function resolveApplication(
  application: Omit<Application, "region" | "functionCategory"> & {
    region?: string | null;
    functionCategory?: string | null;
    companyId?: string | null;
  },
  categories: Category[],
  companies: Company[] = []
): Application {
  const companyId =
    application.companyId &&
    companies.some((company) => company.id === application.companyId)
      ? application.companyId
      : null;
  return {
    ...application,
    companyId,
    company:
      companies.find((company) => company.id === companyId)?.name ??
      application.company,
    tagIds: application.tagIds ?? [],
    region:
      categories.find((category) => category.id === application.regionId)
        ?.name ?? null,
    functionCategory:
      categories.find((category) => category.id === application.functionId)
        ?.name ?? null,
  };
}

export function resolveApplications(
  applications: Omit<Application, "region" | "functionCategory">[],
  categories: Category[],
  companies: Company[] = []
) {
  return applications.map((application) =>
    resolveApplication(application, categories, companies)
  );
}

export function eventFieldsFromInput(input: ApplicationEventInput) {
  const title = input.title.trim();
  const date = input.date.trim();
  if (!title) throw new Error("Title is required.");
  if (!date) throw new Error("Date is required.");
  return {
    eventType: input.eventType.trim() || "Other",
    title,
    date,
    time: emptyToNull(input.time),
    notes: emptyToNull(input.notes),
    interviewer: emptyToNull(input.interviewer),
    interviewType: emptyToNull(input.interviewType),
    method: emptyToNull(input.method),
  };
}

export function normalizeEvent(
  event: Partial<ApplicationEvent> & {
    applicationId: string;
    title?: string;
    date?: string;
  }
): ApplicationEvent {
  return {
    id: event.id ?? createId(),
    applicationId: event.applicationId,
    eventType: event.eventType?.trim() || "Other",
    title: event.title?.trim() || event.eventType?.trim() || "Other",
    date: event.date?.slice(0, 10) || "",
    time: event.time ?? null,
    notes: event.notes ?? null,
    interviewer: event.interviewer ?? null,
    interviewType: event.interviewType ?? null,
    method: event.method ?? null,
    createdAt: event.createdAt ?? nowIso(),
    updatedAt: event.updatedAt ?? nowIso(),
  };
}
