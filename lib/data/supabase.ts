import {
  assertRenamableCategory,
  functionNameTaken,
  isLegacySeedTagId,
  normalizeCategory,
  systemFunctionTemplate,
} from "@/lib/classifications";
import { companyNameTaken, findCompanyByName } from "@/lib/companies";
import { getStatusForStage } from "@/lib/constants";
import { applicationFieldsFromInput, eventFieldsFromInput, resolveApplications } from "@/lib/data/helpers";
import { migrateSnapshot } from "@/lib/data/migrate";
import {
  companiesInitialized,
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
import { getSupabaseClient } from "@/lib/supabase/client";
import { requireUser, requireUserId } from "@/lib/supabase/session";
import {
  buildResumeStoragePath,
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
  ApplicationSection,
  ApplicationSnapshot,
  ApplicationSnapshotInput,
  Category,
  CategoryType,
  Company,
  EventWriteOptions,
  Tag,
} from "@/types";

type ApplicationRow = {
  id: string;
  company: string;
  company_id?: string | null;
  position: string;
  location: string | null;
  region_id: string | null;
  function_id: string | null;
  status: ApplicationSection;
  stage: string;
  job_type: string | null;
  applied_date: string | null;
  job_url: string | null;
  job_id: string | null;
  resume_used: string | null;
  source: string | null;
  referral_code: string | null;
  notes: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
};

type CategoryRow = {
  id: string;
  name: string;
  type: CategoryType;
  is_system?: boolean | null;
  translation_key?: string | null;
  created_at: string;
  updated_at: string;
};

type CompanyRow = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

type TagRow = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

type EventRow = {
  id: string;
  application_id: string;
  event_type: string;
  title: string;
  event_date: string;
  event_time: string | null;
  notes: string | null;
  interviewer: string | null;
  interview_type: string | null;
  method: string | null;
  created_at: string;
  updated_at: string;
};

type SnapshotRow = {
  id: string;
  application_id: string;
  job_description: string | null;
  referral_code: string | null;
  resume_file_name: string | null;
  resume_storage_path: string | null;
  resume_mime_type: string | null;
  resume_file_size: number | null;
  created_at: string;
  updated_at: string;
};

function mapCategory(row: CategoryRow): Category {
  return normalizeCategory({
    id: row.id,
    name: row.name,
    type: row.type,
    isSystem: Boolean(row.is_system),
    translationKey: row.translation_key as Category["translationKey"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function mapCompany(row: CompanyRow): Company {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTag(row: TagRow): Tag {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapEvent(row: EventRow): ApplicationEvent {
  return {
    id: row.id,
    applicationId: row.application_id,
    eventType: row.event_type,
    title: row.title,
    date: row.event_date,
    time: row.event_time ? String(row.event_time).slice(0, 5) : null,
    notes: row.notes,
    interviewer: row.interviewer,
    interviewType: row.interview_type,
    method: row.method,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSnapshot(row: SnapshotRow): ApplicationSnapshot {
  return {
    id: row.id,
    applicationId: row.application_id,
    jobDescription: row.job_description,
    referralCode: row.referral_code,
    resumeFileName: row.resume_file_name,
    resumeStoragePath: row.resume_storage_path,
    resumeMimeType: row.resume_mime_type,
    resumeFileSize: row.resume_file_size,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function snapshotWritePayload(snapshot: ApplicationSnapshot, userId: string) {
  return {
    id: snapshot.id,
    application_id: snapshot.applicationId,
    user_id: userId,
    job_description: snapshot.jobDescription,
    referral_code: snapshot.referralCode,
    resume_file_name: snapshot.resumeFileName,
    resume_storage_path: snapshot.resumeStoragePath,
    resume_mime_type: snapshot.resumeMimeType,
    resume_file_size: snapshot.resumeFileSize,
    created_at: snapshot.createdAt,
    updated_at: snapshot.updatedAt,
  };
}

function eventWritePayload(input: ApplicationEventInput) {
  const fields = eventFieldsFromInput(input);
  return {
    event_type: fields.eventType,
    title: fields.title,
    event_date: fields.date,
    event_time: fields.time,
    notes: fields.notes,
    interviewer: fields.interviewer,
    interview_type: fields.interviewType,
    method: fields.method,
  };
}

function mapApplication(
  row: ApplicationRow,
  tagIds: string[],
  categories: Category[],
  companies: Company[]
): Application {
  return resolveApplications(
    [
      {
        id: row.id,
        company: row.company,
        companyId: row.company_id ?? null,
        position: row.position,
        location: row.location,
        regionId: row.region_id,
        functionId: row.function_id,
        tagIds,
        status: row.status,
        stage: row.stage,
        jobType: row.job_type,
        appliedDate: row.applied_date,
        jobUrl: row.job_url,
        jobId: row.job_id,
        resumeUsed: row.resume_used,
        source: row.source,
        referralCode: row.referral_code,
        notes: row.notes,
        archived: row.archived,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    ],
    categories,
    companies
  )[0];
}

function writePayload(input: ApplicationInput) {
  const fields = applicationFieldsFromInput(input);
  return {
    company: fields.company,
    company_id: fields.companyId,
    position: fields.position,
    location: fields.location,
    region_id: fields.regionId,
    function_id: fields.functionId,
    status: fields.status,
    stage: fields.stage,
    job_type: fields.jobType,
    applied_date: fields.appliedDate,
    job_url: fields.jobUrl,
    job_id: fields.jobId,
    resume_used: fields.resumeUsed,
    source: fields.source,
    referral_code: fields.referralCode,
    notes: fields.notes,
  };
}

async function replaceTags(
  applicationId: string,
  tagIds: string[],
  userId: string
) {
  const supabase = getSupabaseClient();
  const { error: deleteError } = await supabase
    .from("application_tags")
    .delete()
    .eq("application_id", applicationId);
  if (deleteError) throw deleteError;
  if (tagIds.length === 0) return;
  const { error } = await supabase.from("application_tags").insert(
    tagIds.map((tagId) => ({
      application_id: applicationId,
      tag_id: tagId,
      user_id: userId,
    }))
  );
  if (error) throw error;
}

async function loadSnapshot(): Promise<TrackerSnapshot> {
  const supabase = getSupabaseClient();
  const [applications, categories, companies, tags, links, events, snapshots] =
    await Promise.all([
      supabase.from("applications").select("*"),
      supabase.from("categories").select("*"),
      supabase.from("companies").select("*"),
      supabase.from("tags").select("*"),
      supabase.from("application_tags").select("*"),
      supabase.from("application_events").select("*"),
      supabase.from("application_snapshots").select("*"),
    ]);
  if (applications.error) throw applications.error;
  if (categories.error) throw categories.error;
  if (companies.error) throw companies.error;
  if (tags.error) throw tags.error;
  if (links.error) throw links.error;
  if (events.error) throw events.error;
  if (snapshots.error) throw snapshots.error;

  const mappedCategories = ((categories.data ?? []) as CategoryRow[]).map(
    mapCategory
  );
  const mappedCompanies = ((companies.data ?? []) as CompanyRow[]).map(
    mapCompany
  );
  const mappedTags = ((tags.data ?? []) as TagRow[]).map(mapTag);
  const tagMap = new Map<string, string[]>();
  for (const link of (links.data ?? []) as {
    application_id: string;
    tag_id: string;
  }[]) {
    const current = tagMap.get(link.application_id) ?? [];
    current.push(link.tag_id);
    tagMap.set(link.application_id, current);
  }

  return {
    categories: mappedCategories,
    companies: mappedCompanies,
    tags: mappedTags,
    applications: ((applications.data ?? []) as ApplicationRow[]).map((row) =>
      mapApplication(
        row,
        tagMap.get(row.id) ?? [],
        mappedCategories,
        mappedCompanies
      )
    ),
    events: ((events.data ?? []) as EventRow[]).map(mapEvent),
    applicationSnapshots: ((snapshots.data ?? []) as SnapshotRow[]).map(
      mapSnapshot
    ),
  };
}

async function insertSeed(snapshot: TrackerSnapshot, userId: string) {
  const supabase = getSupabaseClient();
  if (snapshot.companies.length > 0) {
    const { error: companyError } = await supabase.from("companies").insert(
      snapshot.companies.map((company) => ({
        id: company.id,
        user_id: userId,
        name: company.name,
        created_at: company.createdAt,
        updated_at: company.updatedAt,
      }))
    );
    if (companyError) throw companyError;
  }
  if (snapshot.categories.length > 0) {
    const { error: categoryError } = await supabase.from("categories").insert(
      snapshot.categories.map((category) => ({
        id: category.id,
        user_id: userId,
        name: category.name,
        type: category.type,
        is_system: category.isSystem,
        translation_key: category.translationKey,
        created_at: category.createdAt,
        updated_at: category.updatedAt,
      }))
    );
    if (categoryError) throw categoryError;
  }
  if (snapshot.tags.length > 0) {
    const { error: tagError } = await supabase.from("tags").insert(
      snapshot.tags.map((tag) => ({
        id: tag.id,
        user_id: userId,
        name: tag.name,
        created_at: tag.createdAt,
        updated_at: tag.updatedAt,
      }))
    );
    if (tagError) throw tagError;
  }
  if (snapshot.applications.length > 0) {
    const { error: applicationError } = await supabase.from("applications").insert(
      snapshot.applications.map((application) => ({
        id: application.id,
        user_id: userId,
        company: application.company,
        company_id: application.companyId,
        position: application.position,
        location: application.location,
        region_id: application.regionId,
        function_id: application.functionId,
        status: application.status,
        stage: application.stage,
        job_type: application.jobType,
        applied_date: application.appliedDate,
        job_url: application.jobUrl,
        job_id: application.jobId,
        resume_used: application.resumeUsed,
        source: application.source,
        referral_code: application.referralCode,
        notes: application.notes,
        archived: application.archived,
        created_at: application.createdAt,
        updated_at: application.updatedAt,
      }))
    );
    if (applicationError) throw applicationError;
  }
  const links = snapshot.applications.flatMap((application) =>
    application.tagIds.map((tagId) => ({
      application_id: application.id,
      tag_id: tagId,
      user_id: userId,
    }))
  );
  if (links.length > 0) {
    const { error } = await supabase.from("application_tags").insert(links);
    if (error) throw error;
  }
  if (snapshot.events.length > 0) {
    const { error } = await supabase.from("application_events").insert(
      snapshot.events.map((event) => ({
        id: event.id,
        user_id: userId,
        application_id: event.applicationId,
        event_type: event.eventType,
        title: event.title,
        event_date: event.date,
        event_time: event.time,
        notes: event.notes,
        interviewer: event.interviewer,
        interview_type: event.interviewType,
        method: event.method,
        created_at: event.createdAt,
        updated_at: event.updatedAt,
      }))
    );
    if (error) throw error;
  }
  if (snapshot.applicationSnapshots.length > 0) {
    const { error } = await supabase.from("application_snapshots").insert(
      snapshot.applicationSnapshots.map((item) =>
        snapshotWritePayload(item, userId)
      )
    );
    if (error) throw error;
  }
}

async function persistClassificationUpgrade(
  original: TrackerSnapshot,
  migrated: TrackerSnapshot
) {
  const supabase = getSupabaseClient();
  const originalById = new Map(
    original.categories.map((category) => [category.id, category])
  );
  const toInsert = migrated.categories.filter((category) => {
    if (originalById.has(category.id)) return false;
    if (category.isSystem) return false;
    return true;
  });
  const toUpdate = migrated.categories.filter((category) => {
    const previous = originalById.get(category.id);
    return (
      previous &&
      (previous.isSystem !== category.isSystem ||
        previous.translationKey !== category.translationKey ||
        previous.name !== category.name)
    );
  });

  if (toInsert.length > 0) {
    const userId = await requireUserId();
    const { error } = await supabase.from("categories").insert(
      toInsert.map((category) => ({
        id: category.id,
        user_id: userId,
        name: category.name,
        type: category.type,
        is_system: category.isSystem,
        translation_key: category.translationKey,
        created_at: category.createdAt,
        updated_at: category.updatedAt,
      }))
    );
    if (error) throw error;
  }

  for (const category of toUpdate) {
    const { error } = await supabase
      .from("categories")
      .update({
        name: category.name,
        is_system: category.isSystem,
        translation_key: category.translationKey,
      })
      .eq("id", category.id);
    if (error) throw error;
  }

  const migratedTagIds = new Set(migrated.tags.map((tag) => tag.id));
  const removedSeedTags = original.tags.filter(
    (tag) => isLegacySeedTagId(tag.id) && !migratedTagIds.has(tag.id)
  );
  if (removedSeedTags.length > 0) {
    const { error } = await supabase
      .from("tags")
      .delete()
      .in(
        "id",
        removedSeedTags.map((tag) => tag.id)
      );
    if (error) throw error;
  }
}

async function persistCompanyUpgrade(
  original: TrackerSnapshot,
  migrated: TrackerSnapshot
) {
  const supabase = getSupabaseClient();
  const originalById = new Set(original.companies.map((company) => company.id));
  const toInsert = migrated.companies.filter(
    (company) => !originalById.has(company.id)
  );
  if (toInsert.length > 0) {
    const userId = await requireUserId();
    const { error } = await supabase.from("companies").insert(
      toInsert.map((company) => ({
        id: company.id,
        user_id: userId,
        name: company.name,
        created_at: company.createdAt,
        updated_at: company.updatedAt,
      }))
    );
    if (error) throw error;
  }

  for (const application of migrated.applications) {
    const previous = original.applications.find(
      (item) => item.id === application.id
    );
    if (
      previous &&
      previous.companyId === application.companyId &&
      previous.company === application.company
    ) {
      continue;
    }
    const { error } = await supabase
      .from("applications")
      .update({
        company: application.company,
        company_id: application.companyId,
      })
      .eq("id", application.id);
    if (error) throw error;
  }
}

export function createSupabaseRepository(): TrackerRepository {
  return {
    mode: "supabase",
    async load() {
      const userId = await requireUserId();
      let snapshot = await loadSnapshot();
      if (snapshot.categories.length === 0) {
        const systemCategories = systemFunctionTemplate(
          new Date().toISOString()
        );
        await insertSeed(
          {
            applications: [],
            categories: systemCategories,
            companies: [],
            tags: [],
            events: [],
            applicationSnapshots: [],
          },
          userId
        );
        snapshot = { ...snapshot, categories: systemCategories };
      }
      markClassificationsInitialized();
      const migrated = migrateSnapshot({
        ...snapshot,
        classificationSeeded: true,
        companiesSeeded:
          companiesInitialized() || snapshot.companies.length > 0,
      });
      await persistClassificationUpgrade(snapshot, migrated);
      await persistCompanyUpgrade(snapshot, migrated);
      markCompaniesInitialized();
      return migrated;
    },
    async createApplication(input: ApplicationInput) {
      const supabase = getSupabaseClient();
      const userId = await requireUserId();
      const company = await ensureSupabaseCompany(input.companyId, input.company);
      const payload = {
        ...writePayload({
          ...input,
          company: company.name,
          companyId: company.id,
        }),
        user_id: userId,
      };
      const fields = applicationFieldsFromInput({
        ...input,
        company: company.name,
        companyId: company.id,
      });
      const { data, error } = await supabase
        .from("applications")
        .insert(payload)
        .select("*")
        .single();
      if (error) throw error;
      await replaceTags((data as ApplicationRow).id, fields.tagIds, userId);
      const snapshot = await loadSnapshot();
      const created = snapshot.applications.find(
        (application) => application.id === (data as ApplicationRow).id
      );
      if (!created) throw new Error("Application not found.");
      return created;
    },
    async updateApplication(id: string, input: ApplicationInput) {
      const supabase = getSupabaseClient();
      const userId = await requireUserId();
      const company = await ensureSupabaseCompany(input.companyId, input.company);
      const fields = applicationFieldsFromInput({
        ...input,
        company: company.name,
        companyId: company.id,
      });
      const { error } = await supabase
        .from("applications")
        .update(
          writePayload({
            ...input,
            company: company.name,
            companyId: company.id,
          })
        )
        .eq("id", id);
      if (error) throw error;
      await replaceTags(id, fields.tagIds, userId);
      const snapshot = await loadSnapshot();
      const updated = snapshot.applications.find(
        (application) => application.id === id
      );
      if (!updated) throw new Error("Application not found.");
      return updated;
    },
    async deleteApplication(id: string) {
      const supabase = getSupabaseClient();
      await removeResumeFilesForApplication("supabase", id);
      const { error } = await supabase.from("applications").delete().eq("id", id);
      if (error) throw error;
    },
    async setArchived(id: string, archived: boolean) {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from("applications")
        .update({ archived })
        .eq("id", id);
      if (error) throw error;
      const snapshot = await loadSnapshot();
      const updated = snapshot.applications.find(
        (application) => application.id === id
      );
      if (!updated) throw new Error("Application not found.");
      return updated;
    },
    async setStage(id: string, stage: string) {
      const supabase = getSupabaseClient();
      const nextStage = stage.trim();
      const { error } = await supabase
        .from("applications")
        .update({
          stage: nextStage,
          status: getStatusForStage(nextStage),
        })
        .eq("id", id);
      if (error) throw error;
      const snapshot = await loadSnapshot();
      const updated = snapshot.applications.find(
        (application) => application.id === id
      );
      if (!updated) throw new Error("Application not found.");
      return updated;
    },
    async replaceSnapshot(snapshot: TrackerSnapshot) {
      const next = migrateSnapshot({
        ...snapshot,
        classificationSeeded: true,
        companiesSeeded: true,
      });
      const supabase = getSupabaseClient();
      const userId = await requireUserId();
      const clear = async (table: string) => {
        const { error } = await supabase.from(table).delete().not("id", "is", null);
        if (error) throw error;
      };
      await clear("applications");
      await clear("tags");
      await clear("categories");
      await clear("companies");
      await insertSeed(next, userId);
      await pruneResumeFiles("supabase", keepResumePaths(next.applicationSnapshots));
      markCompaniesInitialized();
    },
    async createCategory(type: CategoryType, name: string) {
      const supabase = getSupabaseClient();
      const trimmed = name.trim();
      if (!trimmed) throw new Error("Name is required.");
      const existing = await supabase.from("categories").select("*");
      if (existing.error) throw existing.error;
      const mapped = ((existing.data ?? []) as CategoryRow[]).map(mapCategory);
      const duplicate = mapped.some(
        (category) =>
          category.type === type &&
          category.name.toLowerCase() === trimmed.toLowerCase()
      );
      if (duplicate) throw new Error("A category with this name already exists.");
      if (type === "function" && functionNameTaken(mapped, trimmed)) {
        throw new Error("A category with this name already exists.");
      }
      const { data, error } = await supabase
        .from("categories")
        .insert({
          name: trimmed,
          type,
          is_system: false,
          translation_key: null,
          user_id: await requireUserId(),
        })
        .select("*")
        .single();
      if (error) throw error;
      return mapCategory(data as CategoryRow);
    },
    async renameCategory(id: string, name: string) {
      const supabase = getSupabaseClient();
      const trimmed = name.trim();
      if (!trimmed) throw new Error("Name is required.");
      const current = await supabase
        .from("categories")
        .select("*")
        .eq("id", id)
        .single();
      if (current.error) throw current.error;
      const existing = mapCategory(current.data as CategoryRow);
      assertRenamableCategory(existing);
      const all = await supabase.from("categories").select("*");
      if (all.error) throw all.error;
      const mapped = ((all.data ?? []) as CategoryRow[]).map(mapCategory);
      if (
        existing.type === "function" &&
        functionNameTaken(mapped, trimmed, id)
      ) {
        throw new Error("A category with this name already exists.");
      }
      const { data, error } = await supabase
        .from("categories")
        .update({ name: trimmed })
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return mapCategory(data as CategoryRow);
    },
    async deleteCategory(id: string) {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    async createTag(name: string) {
      const supabase = getSupabaseClient();
      const trimmed = name.trim();
      if (!trimmed) throw new Error("Name is required.");
      const existing = await supabase
        .from("tags")
        .select("*")
        .ilike("name", trimmed)
        .maybeSingle();
      if (existing.error) throw existing.error;
      if (existing.data) return mapTag(existing.data as TagRow);
      const { data, error } = await supabase
        .from("tags")
        .insert({ name: trimmed, user_id: await requireUserId() })
        .select("*")
        .single();
      if (error) throw error;
      return mapTag(data as TagRow);
    },
    async renameTag(id: string, name: string) {
      const supabase = getSupabaseClient();
      const trimmed = name.trim();
      if (!trimmed) throw new Error("Name is required.");
      const { data, error } = await supabase
        .from("tags")
        .update({ name: trimmed })
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return mapTag(data as TagRow);
    },
    async deleteTag(id: string) {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from("tags").delete().eq("id", id);
      if (error) throw error;
    },
    async createCompany(name: string) {
      return ensureSupabaseCompany(null, name);
    },
    async renameCompany(id: string, name: string) {
      const supabase = getSupabaseClient();
      const trimmed = name.trim();
      if (!trimmed) throw new Error("Name is required.");
      const all = await supabase.from("companies").select("*");
      if (all.error) throw all.error;
      const mapped = ((all.data ?? []) as CompanyRow[]).map(mapCompany);
      if (companyNameTaken(mapped, trimmed, id)) {
        throw new Error("A company with this name already exists.");
      }
      const { data, error } = await supabase
        .from("companies")
        .update({ name: trimmed })
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      const { error: appError } = await supabase
        .from("applications")
        .update({ company: trimmed })
        .eq("company_id", id);
      if (appError) throw appError;
      return mapCompany(data as CompanyRow);
    },
    async deleteCompany(id: string) {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from("companies").delete().eq("id", id);
      if (error) throw error;
    },
    async createEvent(
      applicationId: string,
      input: ApplicationEventInput,
      options?: EventWriteOptions
    ) {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("application_events")
        .insert({
          application_id: applicationId,
          user_id: await requireUserId(),
          ...eventWritePayload(input),
        })
        .select("*")
        .single();
      if (error) throw error;
      await applyApplicationOptions(applicationId, options);
      return mapEvent(data as EventRow);
    },
    async updateEvent(
      id: string,
      input: ApplicationEventInput,
      options?: EventWriteOptions
    ) {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("application_events")
        .update(eventWritePayload(input))
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      const event = mapEvent(data as EventRow);
      await applyApplicationOptions(event.applicationId, options);
      return event;
    },
    async deleteEvent(id: string) {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from("application_events")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    async saveApplicationSnapshot(
      applicationId: string,
      input: ApplicationSnapshotInput
    ) {
      const supabase = getSupabaseClient();
      const user = await requireUser();
      const userId = user.id;
      const current = await loadSnapshot();
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
      let uploadedPath: string | null = null;

      try {
        if (input.resumeFile) {
          const error = resumeFileError(input.resumeFile);
          if (error) {
            throw new Error(
              error === "size"
                ? "Resume file is too large."
                : "Resume file type is not allowed."
            );
          }
          const nextPath = buildResumeStoragePath(
            user.id,
            applicationId,
            input.resumeFile.name
          );
          await storeResumeFile(
            "supabase",
            nextPath,
            input.resumeFile,
            resumeMimeType(input.resumeFile)
          );
          uploadedPath = nextPath;
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

        const now = new Date().toISOString();
        const saved: ApplicationSnapshot = {
          id: existing?.id ?? crypto.randomUUID(),
          applicationId,
          jobDescription: fields.jobDescription,
          referralCode: fields.referralCode,
          resumeFileName,
          resumeStoragePath,
          resumeMimeType: resumeMimeTypeValue,
          resumeFileSize,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
        };
        const { data, error } = await supabase
          .from("application_snapshots")
          .upsert(snapshotWritePayload(saved, userId), { onConflict: "application_id" })
          .select("*")
          .single();
        if (error) throw error;
        if (
          existing?.resumeStoragePath &&
          existing.resumeStoragePath !== saved.resumeStoragePath
        ) {
          await removeResumeFile("supabase", existing.resumeStoragePath);
        }
        return mapSnapshot(data as SnapshotRow);
      } catch (error) {
        if (uploadedPath) {
          await removeResumeFile("supabase", uploadedPath);
        }
        throw error;
      }
    },
    async deleteApplicationSnapshot(applicationId: string) {
      const supabase = getSupabaseClient();
      const existing = (await loadSnapshot()).applicationSnapshots.find(
        (item) => item.applicationId === applicationId
      );
      const { error } = await supabase
        .from("application_snapshots")
        .delete()
        .eq("application_id", applicationId);
      if (error) throw error;
      await removeResumeFile("supabase", existing?.resumeStoragePath);
    },
    async getResumeBlob(snapshot: ApplicationSnapshot) {
      if (!snapshot.resumeStoragePath) {
        throw new Error("Resume file not found.");
      }
      return fetchResumeFile("supabase", snapshot.resumeStoragePath);
    },
  };
}

async function ensureSupabaseCompany(
  companyId: string | null | undefined,
  name: string
) {
  const supabase = getSupabaseClient();
  const trimmed = name.trim();
  if (companyId) {
    const current = await supabase
      .from("companies")
      .select("*")
      .eq("id", companyId)
      .maybeSingle();
    if (current.error) throw current.error;
    if (current.data) return mapCompany(current.data as CompanyRow);
  }
  if (!trimmed) throw new Error("Name is required.");
  const existing = await supabase.from("companies").select("*");
  if (existing.error) throw existing.error;
  const mapped = ((existing.data ?? []) as CompanyRow[]).map(mapCompany);
  const match = findCompanyByName(mapped, trimmed);
  if (match) return match;
  const { data, error } = await supabase
    .from("companies")
    .insert({ name: trimmed, user_id: await requireUserId() })
    .select("*")
    .single();
  if (error) throw error;
  return mapCompany(data as CompanyRow);
}

async function applyApplicationOptions(
  applicationId: string,
  options?: EventWriteOptions
) {
  if (!options) return;
  const patch: { stage?: string; status?: ApplicationSection } = {};
  if (options.stage?.trim()) {
    patch.stage = options.stage.trim();
    patch.status = getStatusForStage(options.stage.trim());
  } else if (options.status) {
    patch.status = options.status;
  }
  if (Object.keys(patch).length === 0) return;
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("applications")
    .update(patch)
    .eq("id", applicationId);
  if (error) throw error;
}
