import {
  assertRenamableCategory,
  functionNameTaken,
} from "@/lib/classifications";
import { companyNameTaken, ensureCompanyRecord, findCompanyByName } from "@/lib/companies";
import { getStatusForStage } from "@/lib/constants";
import {
  applicationFieldsFromInput,
  createId,
  eventFieldsFromInput,
  nowIso,
  resolveApplication,
  resolveApplications,
} from "@/lib/data/helpers";
import { migrateSnapshot } from "@/lib/data/migrate";
import { createSeedSnapshot } from "@/lib/data/seed";
import {
  markClassificationsInitialized,
  markCompaniesInitialized,
} from "@/lib/data/init";
import {
  fetchResumeFile,
  pruneResumeFiles,
  removeResumeFile,
  removeResumeFilesForApplication,
  storeResumeFile,
} from "@/lib/storage/resume";
import type { TrackerRepository, TrackerSnapshot } from "@/lib/data/types";
import {
  generatedResumeFileName,
  keepResumePaths,
  resumeFileError,
  resumeMimeType,
  snapshotFieldsFromInput,
} from "@/lib/snapshots";
import type {
  Application,
  ApplicationEvent,
  ApplicationEventInput,
  ApplicationInput,
  ApplicationSnapshot,
  ApplicationSnapshotInput,
  Category,
  CategoryType,
  Company,
  EventWriteOptions,
  Tag,
} from "@/types";

const STORAGE_KEY = "job-tracker:phase3";
const LEGACY_KEYS = ["job-tracker:phase2", "job-tracker:phase1"];

function readSnapshot(): TrackerSnapshot {
  if (typeof window === "undefined") {
    return createSeedSnapshot();
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const migrated = migrateSnapshot(JSON.parse(raw));
      writeSnapshot(migrated);
      return migrated;
    } catch {
      return createSeedSnapshot();
    }
  }
  const legacyKeys = LEGACY_KEYS;
  for (const key of legacyKeys) {
    const legacy = window.localStorage.getItem(key);
    if (!legacy) continue;
    try {
      const migrated = migrateSnapshot(JSON.parse(legacy));
      writeSnapshot(migrated);
      return migrated;
    } catch {
      continue;
    }
  }
  const seed = createSeedSnapshot();
  writeSnapshot(seed);
  return seed;
}

function writeSnapshot(snapshot: TrackerSnapshot) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  markClassificationsInitialized();
  markCompaniesInitialized();
}

function mutate(updater: (snapshot: TrackerSnapshot) => TrackerSnapshot) {
  const next = updater(structuredClone(readSnapshot()));
  next.applications = resolveApplications(
    next.applications,
    next.categories,
    next.companies
  );
  next.events = next.events ?? [];
  next.applicationSnapshots = next.applicationSnapshots ?? [];
  writeSnapshot(next);
  return next;
}

function applyEventOptions(
  snapshot: TrackerSnapshot,
  applicationId: string,
  options?: EventWriteOptions
) {
  if (!options) return;
  snapshot.applications = snapshot.applications.map((application) => {
    if (application.id !== applicationId) return application;
    const nextStage = options.stage?.trim() || application.stage;
    return {
      ...application,
      stage: nextStage,
      status: options.stage?.trim()
        ? getStatusForStage(nextStage)
        : (options.status ?? application.status),
      updatedAt: nowIso(),
    };
  });
}

function requireName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Name is required.");
  return trimmed;
}

export function createLocalRepository(): TrackerRepository {
  return {
    mode: "local",
    async load() {
      return readSnapshot();
    },
    async createApplication(input: ApplicationInput) {
      const now = nowIso();
      const fields = applicationFieldsFromInput(input);
      let created: Application | null = null;
      mutate((snapshot) => {
        const company = ensureCompanyRecord(
          snapshot.companies,
          fields.company,
          fields.companyId
        );
        created = resolveApplication(
          {
            id: createId(),
            ...fields,
            company: company?.name ?? fields.company,
            companyId: company?.id ?? null,
            archived: false,
            createdAt: now,
            updatedAt: now,
          },
          snapshot.categories,
          snapshot.companies
        );
        snapshot.applications.push(created);
        return snapshot;
      });
      if (!created) throw new Error("Could not create application.");
      return created;
    },
    async updateApplication(id: string, input: ApplicationInput) {
      let updated: Application | null = null;
      mutate((snapshot) => {
        snapshot.applications = snapshot.applications.map((application) => {
          if (application.id !== id) return application;
          const fields = applicationFieldsFromInput(input);
          const company = ensureCompanyRecord(
            snapshot.companies,
            fields.company,
            fields.companyId
          );
          updated = resolveApplication(
            {
              ...application,
              ...fields,
              company: company?.name ?? fields.company,
              companyId: company?.id ?? null,
              updatedAt: nowIso(),
            },
            snapshot.categories,
            snapshot.companies
          );
          return updated;
        });
        return snapshot;
      });
      if (!updated) throw new Error("Application not found.");
      return updated;
    },
    async deleteApplication(id: string) {
      mutate((snapshot) => {
        snapshot.applications = snapshot.applications.filter(
          (application) => application.id !== id
        );
        snapshot.events = snapshot.events.filter(
          (event) => event.applicationId !== id
        );
        snapshot.applicationSnapshots = snapshot.applicationSnapshots.filter(
          (item) => item.applicationId !== id
        );
        return snapshot;
      });
      await removeResumeFilesForApplication("local", id);
    },
    async setArchived(id: string, archived: boolean) {
      let updated: Application | null = null;
      mutate((snapshot) => {
        snapshot.applications = snapshot.applications.map((application) => {
          if (application.id !== id) return application;
          updated = { ...application, archived, updatedAt: nowIso() };
          return updated;
        });
        return snapshot;
      });
      if (!updated) throw new Error("Application not found.");
      return updated;
    },
    async setStage(id: string, stage: string) {
      let updated: Application | null = null;
      mutate((snapshot) => {
        snapshot.applications = snapshot.applications.map((application) => {
          if (application.id !== id) return application;
          const nextStage = stage.trim() || application.stage;
          updated = {
            ...application,
            stage: nextStage,
            status: getStatusForStage(nextStage),
            updatedAt: nowIso(),
          };
          return updated;
        });
        return snapshot;
      });
      if (!updated) throw new Error("Application not found.");
      return updated;
    },
    async replaceSnapshot(snapshot: TrackerSnapshot) {
      const next = migrateSnapshot(snapshot);
      writeSnapshot(next);
      await pruneResumeFiles("local", keepResumePaths(next.applicationSnapshots));
    },
    async createCategory(type: CategoryType, name: string) {
      const trimmed = requireName(name);
      let created: Category | null = null;
      mutate((snapshot) => {
        const duplicate = snapshot.categories.some(
          (category) =>
            category.type === type &&
            category.name.toLowerCase() === trimmed.toLowerCase()
        );
        if (duplicate) throw new Error("A category with this name already exists.");
        if (type === "function" && functionNameTaken(snapshot.categories, trimmed)) {
          throw new Error("A category with this name already exists.");
        }
        created = {
          id: createId(),
          name: trimmed,
          type,
          isSystem: false,
          translationKey: null,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
        snapshot.categories.push(created);
        return snapshot;
      });
      if (!created) throw new Error("Could not create category.");
      return created;
    },
    async renameCategory(id: string, name: string) {
      const trimmed = requireName(name);
      let updated: Category | null = null;
      mutate((snapshot) => {
        const current = snapshot.categories.find((category) => category.id === id);
        if (!current) throw new Error("Category not found.");
        assertRenamableCategory(current);
        if (current.type === "function" && functionNameTaken(snapshot.categories, trimmed, id)) {
          throw new Error("A category with this name already exists.");
        }
        const duplicate = snapshot.categories.some(
          (category) =>
            category.id !== id &&
            category.type === current.type &&
            category.name.toLowerCase() === trimmed.toLowerCase()
        );
        if (duplicate) throw new Error("A category with this name already exists.");
        snapshot.categories = snapshot.categories.map((category) => {
          if (category.id !== id) return category;
          updated = { ...category, name: trimmed, updatedAt: nowIso() };
          return updated;
        });
        return snapshot;
      });
      if (!updated) throw new Error("Category not found.");
      return updated;
    },
    async deleteCategory(id: string) {
      mutate((snapshot) => {
        snapshot.categories = snapshot.categories.filter(
          (category) => category.id !== id
        );
        snapshot.applications = snapshot.applications.map((application) => ({
          ...application,
          regionId: application.regionId === id ? null : application.regionId,
          functionId: application.functionId === id ? null : application.functionId,
        }));
        return snapshot;
      });
    },
    async createTag(name: string) {
      const trimmed = requireName(name);
      let created: Tag | null = null;
      mutate((snapshot) => {
        const existing = snapshot.tags.find(
          (tag) => tag.name.toLowerCase() === trimmed.toLowerCase()
        );
        if (existing) {
          created = existing;
          return snapshot;
        }
        created = {
          id: createId(),
          name: trimmed,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
        snapshot.tags.push(created);
        return snapshot;
      });
      if (!created) throw new Error("Could not create tag.");
      return created;
    },
    async renameTag(id: string, name: string) {
      const trimmed = requireName(name);
      let updated: Tag | null = null;
      mutate((snapshot) => {
        const duplicate = snapshot.tags.some(
          (tag) =>
            tag.id !== id && tag.name.toLowerCase() === trimmed.toLowerCase()
        );
        if (duplicate) throw new Error("A tag with this name already exists.");
        snapshot.tags = snapshot.tags.map((tag) => {
          if (tag.id !== id) return tag;
          updated = { ...tag, name: trimmed, updatedAt: nowIso() };
          return updated;
        });
        return snapshot;
      });
      if (!updated) throw new Error("Tag not found.");
      return updated;
    },
    async deleteTag(id: string) {
      mutate((snapshot) => {
        snapshot.tags = snapshot.tags.filter((tag) => tag.id !== id);
        snapshot.applications = snapshot.applications.map((application) => ({
          ...application,
          tagIds: application.tagIds.filter((tagId) => tagId !== id),
        }));
        return snapshot;
      });
    },
    async createCompany(name: string) {
      const trimmed = requireName(name);
      let created: Company | null = null;
      mutate((snapshot) => {
        const existing = findCompanyByName(snapshot.companies, trimmed);
        if (existing) {
          created = existing;
          return snapshot;
        }
        created = {
          id: createId(),
          name: trimmed,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
        snapshot.companies.push(created);
        return snapshot;
      });
      if (!created) throw new Error("Could not create company.");
      return created;
    },
    async renameCompany(id: string, name: string) {
      const trimmed = requireName(name);
      let updated: Company | null = null;
      mutate((snapshot) => {
        if (companyNameTaken(snapshot.companies, trimmed, id)) {
          throw new Error("A company with this name already exists.");
        }
        snapshot.companies = snapshot.companies.map((company) => {
          if (company.id !== id) return company;
          updated = { ...company, name: trimmed, updatedAt: nowIso() };
          return updated;
        });
        if (!updated) throw new Error("Company not found.");
        snapshot.applications = snapshot.applications.map((application) =>
          application.companyId === id
            ? { ...application, company: trimmed, updatedAt: nowIso() }
            : application
        );
        return snapshot;
      });
      if (!updated) throw new Error("Company not found.");
      return updated;
    },
    async deleteCompany(id: string) {
      mutate((snapshot) => {
        snapshot.companies = snapshot.companies.filter(
          (company) => company.id !== id
        );
        snapshot.applications = snapshot.applications.map((application) => ({
          ...application,
          companyId: application.companyId === id ? null : application.companyId,
        }));
        return snapshot;
      });
    },
    async createEvent(
      applicationId: string,
      input: ApplicationEventInput,
      options?: EventWriteOptions
    ) {
      const fields = eventFieldsFromInput(input);
      const now = nowIso();
      let created: ApplicationEvent | null = null;
      mutate((snapshot) => {
        if (
          !snapshot.applications.some((application) => application.id === applicationId)
        ) {
          throw new Error("Application not found.");
        }
        created = {
          id: createId(),
          applicationId,
          ...fields,
          createdAt: now,
          updatedAt: now,
        };
        snapshot.events.push(created);
        applyEventOptions(snapshot, applicationId, options);
        return snapshot;
      });
      if (!created) throw new Error("Could not create event.");
      return created;
    },
    async updateEvent(
      id: string,
      input: ApplicationEventInput,
      options?: EventWriteOptions
    ) {
      const fields = eventFieldsFromInput(input);
      let updated: ApplicationEvent | null = null;
      mutate((snapshot) => {
        snapshot.events = snapshot.events.map((event) => {
          if (event.id !== id) return event;
          updated = {
            ...event,
            ...fields,
            updatedAt: nowIso(),
          };
          return updated;
        });
        if (!updated) throw new Error("Event not found.");
        applyEventOptions(snapshot, updated.applicationId, options);
        return snapshot;
      });
      if (!updated) throw new Error("Event not found.");
      return updated;
    },
    async deleteEvent(id: string) {
      mutate((snapshot) => {
        snapshot.events = snapshot.events.filter((event) => event.id !== id);
        return snapshot;
      });
    },
    async saveApplicationSnapshot(
      applicationId: string,
      input: ApplicationSnapshotInput
    ) {
      const current = readSnapshot();
      if (
        !current.applications.some((application) => application.id === applicationId)
      ) {
        throw new Error("Application not found.");
      }
      const existing = current.applicationSnapshots.find(
        (item) => item.applicationId === applicationId
      );
      const fields = snapshotFieldsFromInput(input);
      let resumeFileName = existing?.resumeFileName ?? null;
      let resumeStoragePath = existing?.resumeStoragePath ?? null;
      let resumeMimeTypeValue = existing?.resumeMimeType ?? null;
      let resumeFileSize = existing?.resumeFileSize ?? null;

      if (input.resumeFile) {
        const error = resumeFileError(input.resumeFile);
        if (error) throw new Error(error === "size" ? "Resume file is too large." : "Resume file type is not allowed.");
        const nextPath = `${applicationId}/${generatedResumeFileName(input.resumeFile.name)}`;
        await storeResumeFile(
          "local",
          nextPath,
          input.resumeFile,
          resumeMimeType(input.resumeFile)
        );
        resumeFileName = input.resumeFile.name;
        resumeStoragePath = nextPath;
        resumeMimeTypeValue = resumeMimeType(input.resumeFile);
        resumeFileSize = input.resumeFile.size;
      } else if (!input.keepExistingResume) {
        resumeFileName = null;
        resumeStoragePath = null;
        resumeMimeTypeValue = null;
        resumeFileSize = null;
      }

      const now = nowIso();
      const previous = current.applicationSnapshots.find(
        (item) => item.applicationId === applicationId
      );
      const saved: ApplicationSnapshot = {
        id: previous?.id ?? createId(),
        applicationId,
        jobDescription: fields.jobDescription,
        referralCode: fields.referralCode,
        resumeFileName,
        resumeStoragePath,
        resumeMimeType: resumeMimeTypeValue,
        resumeFileSize,
        createdAt: previous?.createdAt ?? now,
        updatedAt: now,
      };
      mutate((snapshot) => {
        snapshot.applicationSnapshots = [
          ...snapshot.applicationSnapshots.filter(
            (item) => item.applicationId !== applicationId
          ),
          saved,
        ];
        return snapshot;
      });
      if (
        existing?.resumeStoragePath &&
        existing.resumeStoragePath !== saved.resumeStoragePath
      ) {
        await removeResumeFile("local", existing.resumeStoragePath);
      }
      return saved;
    },
    async deleteApplicationSnapshot(applicationId: string) {
      const existing = readSnapshot().applicationSnapshots.find(
        (item) => item.applicationId === applicationId
      );
      mutate((snapshot) => {
        snapshot.applicationSnapshots = snapshot.applicationSnapshots.filter(
          (item) => item.applicationId !== applicationId
        );
        return snapshot;
      });
      await removeResumeFile("local", existing?.resumeStoragePath);
    },
    async getResumeBlob(snapshot: ApplicationSnapshot) {
      if (!snapshot.resumeStoragePath) {
        throw new Error("Resume file not found.");
      }
      return fetchResumeFile("local", snapshot.resumeStoragePath);
    },
  };
}
