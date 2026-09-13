import {
  isLegacySeedTagId,
  normalizeCategory,
  SYSTEM_FUNCTIONS,
} from "@/lib/classifications";
import { findCompanyByName } from "@/lib/companies";
import { getStatusForStage } from "@/lib/constants";
import { createId, nowIso, normalizeEvent, resolveApplications } from "@/lib/data/helpers";
import { createSeedSnapshot } from "@/lib/data/seed";
import { parseSnapshots } from "@/lib/snapshots";
import type { TrackerSnapshot } from "@/lib/data/types";
import type {
  Application,
  ApplicationEvent,
  Category,
  CategoryType,
  Company,
  Tag,
} from "@/types";

interface LegacyApplication {
  id: string;
  company: string;
  companyId?: string | null;
  position: string;
  location?: string | null;
  region?: string | null;
  regionId?: string | null;
  functionCategory?: string | null;
  functionId?: string | null;
  tagIds?: string[];
  status: Application["status"];
  stage: string;
  jobType?: string | null;
  appliedDate?: string | null;
  jobUrl?: string | null;
  jobId?: string | null;
  resumeUsed?: string | null;
  source?: string | null;
  referralCode?: string | null;
  notes?: string | null;
  archived?: boolean;
  createdAt: string;
  updatedAt: string;
}

function parseCategories(raw: unknown): Category[] {
  if (!Array.isArray(raw)) return [];
  const parsed: Category[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const category = item as Partial<Category>;
    if (typeof category.id !== "string" || typeof category.name !== "string") {
      continue;
    }
    if (category.type !== "region" && category.type !== "function") continue;
    parsed.push(
      normalizeCategory({
        id: category.id,
        name: category.name,
        type: category.type,
        isSystem: category.isSystem,
        translationKey: category.translationKey,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      })
    );
  }
  return parsed;
}

function ensureCategory(
  categories: Category[],
  type: CategoryType,
  name: string | null | undefined
) {
  const trimmed = name?.trim();
  if (!trimmed) return null;
  const existing = categories.find(
    (category) =>
      category.type === type &&
      category.name.toLowerCase() === trimmed.toLowerCase()
  );
  if (existing) return existing.id;
  const timestamp = nowIso();
  const created: Category = {
    id: createId(),
    name: trimmed,
    type,
    isSystem: false,
    translationKey: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  categories.push(created);
  return created.id;
}

function parseCompanies(raw: unknown): Company[] {
  if (!Array.isArray(raw)) return [];
  const parsed: Company[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const company = item as Partial<Company>;
    if (typeof company.id !== "string" || typeof company.name !== "string") {
      continue;
    }
    const name = company.name.trim();
    if (!name) continue;
    parsed.push({
      id: company.id,
      name,
      createdAt: company.createdAt ?? nowIso(),
      updatedAt: company.updatedAt ?? nowIso(),
    });
  }
  return parsed;
}

function ensureCompany(companies: Company[], name: string | null | undefined) {
  const trimmed = name?.trim();
  if (!trimmed) return null;
  const existing = findCompanyByName(companies, trimmed);
  if (existing) return existing.id;
  const timestamp = nowIso();
  const created: Company = {
    id: createId(),
    name: trimmed,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  companies.push(created);
  return created.id;
}

function resolveCompanyId(
  companies: Company[],
  id: string | null | undefined,
  legacyName: string | null | undefined,
  allowCreate: boolean
) {
  if (id && companies.some((company) => company.id === id)) {
    return id;
  }
  if (!allowCreate) return null;
  return ensureCompany(companies, legacyName);
}

function upgradeExistingFunctions(categories: Category[]) {
  const timestamp = nowIso();

  for (const def of SYSTEM_FUNCTIONS) {
    const existingSystem = categories.find(
      (category) =>
        category.type === "function" &&
        category.isSystem &&
        category.translationKey === def.key
    );
    const byId = categories.find(
      (category) => category.type === "function" && category.id === def.id
    );
    const target = existingSystem ?? byId;
    if (!target) continue;

    target.name = def.name;
    target.isSystem = true;
    target.translationKey = def.key;
    target.updatedAt = timestamp;
  }

  for (const category of categories) {
    if (category.type !== "function") {
      category.isSystem = false;
      category.translationKey = null;
      continue;
    }
    if (!category.isSystem || !category.translationKey) {
      category.isSystem = false;
      category.translationKey = null;
      continue;
    }
    const matched = SYSTEM_FUNCTIONS.find(
      (item) => item.key === category.translationKey
    );
    if (!matched) {
      category.isSystem = false;
      category.translationKey = null;
    }
  }
}

function resolveClassificationId(
  categories: Category[],
  type: CategoryType,
  id: string | null | undefined,
  legacyName: string | null | undefined,
  allowLegacyCreate: boolean
) {
  if (
    id &&
    categories.some((category) => category.id === id && category.type === type)
  ) {
    return id;
  }
  if (id || !allowLegacyCreate) return null;
  return ensureCategory(categories, type, legacyName);
}

function pruneUnusedSeedTags(tags: Tag[], applications: LegacyApplication[]) {
  const used = new Set(
    applications.flatMap((application) => application.tagIds ?? [])
  );
  return tags.filter((tag) => !isLegacySeedTagId(tag.id) || used.has(tag.id));
}

export function migrateSnapshot(raw: unknown): TrackerSnapshot {
  const seed = createSeedSnapshot();
  if (!raw || typeof raw !== "object") return seed;

  const data = raw as {
    applications?: LegacyApplication[];
    categories?: unknown;
    companies?: unknown;
    tags?: Tag[];
    events?: ApplicationEvent[];
    applicationSnapshots?: unknown;
    classificationSeeded?: boolean;
    companiesSeeded?: boolean;
  };

  if (!Array.isArray(data.applications)) return seed;

  const categories = parseCategories(data.categories);
  const companies = parseCompanies(data.companies);
  const tags = Array.isArray(data.tags) ? [...data.tags] : [];
  const applicationIds = new Set(data.applications.map((item) => item.id));
  const allowLegacyCreate = data.classificationSeeded !== true;
  const allowCompanyCreate = data.companiesSeeded !== true;

  const applications = data.applications.map((application) => {
    const regionId = resolveClassificationId(
      categories,
      "region",
      application.regionId,
      application.region,
      allowLegacyCreate
    );
    const functionId = resolveClassificationId(
      categories,
      "function",
      application.functionId,
      application.functionCategory,
      allowLegacyCreate
    );
    const companyId = resolveCompanyId(
      companies,
      application.companyId,
      application.company,
      allowCompanyCreate
    );
    const tagIds = (application.tagIds ?? []).filter((id) =>
      tags.some((tag) => tag.id === id)
    );

    return {
      id: application.id,
      company: application.company,
      companyId,
      position: application.position,
      location: application.location ?? null,
      regionId,
      functionId,
      tagIds,
      status: getStatusForStage(application.stage),
      stage: application.stage,
      jobType: application.jobType ?? null,
      appliedDate: application.appliedDate ?? null,
      jobUrl: application.jobUrl ?? null,
      jobId: application.jobId ?? null,
      resumeUsed: application.resumeUsed ?? null,
      source: application.source ?? null,
      referralCode: application.referralCode ?? null,
      notes: application.notes ?? null,
      archived: Boolean(application.archived),
      createdAt: application.createdAt,
      updatedAt: application.updatedAt,
    };
  });

  upgradeExistingFunctions(categories);
  const nextTags = pruneUnusedSeedTags(tags, data.applications);

  const events = Array.isArray(data.events)
    ? data.events
        .filter((event) => applicationIds.has(event.applicationId))
        .map((event) => normalizeEvent(event))
        .filter((event) => event.date)
    : seed.events.filter((event) => applicationIds.has(event.applicationId));

  return {
    categories,
    companies,
    tags: nextTags,
    applications: resolveApplications(applications, categories, companies),
    events,
    applicationSnapshots: parseSnapshots(data.applicationSnapshots, applicationIds),
    classificationSeeded: true,
    companiesSeeded: true,
  };
}
