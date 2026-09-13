import { isInterviewingStage, isOfferStage } from "@/lib/constants";
import type { Application, ApplicationListFilters } from "@/types";

export function applyListFilters(
  applications: Application[],
  filters: ApplicationListFilters,
  extras?: {
    functionLabel?: (application: Application) => string | null;
    tagNames?: (application: Application) => string[];
  }
) {
  const query = filters.search.trim().toLowerCase();

  return applications.filter((application) => {
    if (application.archived !== filters.archived) return false;
    if (filters.status && application.status !== filters.status) return false;
    if (filters.regionId && application.regionId !== filters.regionId) {
      return false;
    }
    if (filters.functionId && application.functionId !== filters.functionId) {
      return false;
    }
    if (filters.stage && application.stage !== filters.stage) return false;
    if (
      filters.tagIds.length > 0 &&
      !filters.tagIds.every((tagId) => application.tagIds.includes(tagId))
    ) {
      return false;
    }
    if (!query) return true;
    const functionLabel =
      extras?.functionLabel?.(application) ?? application.functionCategory;
    const tagNames = extras?.tagNames?.(application) ?? [];
    return (
      application.company.toLowerCase().includes(query) ||
      application.position.toLowerCase().includes(query) ||
      (application.referralCode ?? "").toLowerCase().includes(query) ||
      (application.region ?? "").toLowerCase().includes(query) ||
      (functionLabel ?? "").toLowerCase().includes(query) ||
      tagNames.some((name) => name.toLowerCase().includes(query))
    );
  });
}

export function sortApplications(applications: Application[]) {
  return [...applications].sort((a, b) => {
    const aDate = a.appliedDate ?? a.createdAt;
    const bDate = b.appliedDate ?? b.createdAt;
    if (aDate !== bDate) return aDate < bDate ? 1 : -1;
    return a.company.localeCompare(b.company);
  });
}

export function getApplicationStats(applications: Application[]) {
  const visible = applications.filter((application) => !application.archived);
  const active = visible.filter((application) => application.status === "active");
  return {
    total: visible.length,
    active: active.length,
    interviewing: active.filter((application) =>
      isInterviewingStage(application.stage)
    ).length,
    offers: active.filter((application) => isOfferStage(application.stage))
      .length,
  };
}

export function parseListQuery(params: URLSearchParams): ApplicationListFilters {
  const status = params.get("status");
  const tags = params.get("tags");
  return {
    search: params.get("q") ?? "",
    status: status === "active" || status === "ended" ? status : null,
    archived: params.get("archived") === "1",
    regionId: params.get("region"),
    functionId: params.get("function"),
    stage: params.get("stage"),
    tagIds: tags ? tags.split(",").filter(Boolean) : [],
  };
}

export function parseGroupByCompany(params: URLSearchParams) {
  return params.get("group") === "company";
}

export function buildListHref(
  filters: Partial<ApplicationListFilters>,
  extras?: { groupByCompany?: boolean }
) {
  const params = new URLSearchParams();
  if (filters.search) params.set("q", filters.search);
  if (filters.status) params.set("status", filters.status);
  if (filters.archived) params.set("archived", "1");
  if (filters.regionId) params.set("region", filters.regionId);
  if (filters.functionId) params.set("function", filters.functionId);
  if (filters.stage) params.set("stage", filters.stage);
  if (filters.tagIds && filters.tagIds.length > 0) {
    params.set("tags", filters.tagIds.join(","));
  }
  if (extras?.groupByCompany) params.set("group", "company");
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

export function hasListFilters(filters: ApplicationListFilters) {
  return Boolean(
    filters.search ||
      filters.status ||
      filters.regionId ||
      filters.functionId ||
      filters.stage ||
      filters.tagIds.length > 0
  );
}
