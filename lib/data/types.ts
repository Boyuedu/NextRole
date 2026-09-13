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

export interface TrackerSnapshot {
  applications: Application[];
  categories: Category[];
  companies: Company[];
  tags: Tag[];
  events: ApplicationEvent[];
  applicationSnapshots: ApplicationSnapshot[];
  classificationSeeded?: boolean;
  companiesSeeded?: boolean;
}

export type StorageMode = "supabase" | "local";

export interface TrackerRepository {
  mode: StorageMode;
  load(): Promise<TrackerSnapshot>;
  createApplication(input: ApplicationInput): Promise<Application>;
  updateApplication(id: string, input: ApplicationInput): Promise<Application>;
  deleteApplication(id: string): Promise<void>;
  setArchived(id: string, archived: boolean): Promise<Application>;
  setStage(id: string, stage: string): Promise<Application>;
  replaceSnapshot(snapshot: TrackerSnapshot): Promise<void>;
  createCategory(type: CategoryType, name: string): Promise<Category>;
  renameCategory(id: string, name: string): Promise<Category>;
  deleteCategory(id: string): Promise<void>;
  createTag(name: string): Promise<Tag>;
  renameTag(id: string, name: string): Promise<Tag>;
  deleteTag(id: string): Promise<void>;
  createCompany(name: string): Promise<Company>;
  renameCompany(id: string, name: string): Promise<Company>;
  deleteCompany(id: string): Promise<void>;
  createEvent(
    applicationId: string,
    input: ApplicationEventInput,
    options?: EventWriteOptions
  ): Promise<ApplicationEvent>;
  updateEvent(
    id: string,
    input: ApplicationEventInput,
    options?: EventWriteOptions
  ): Promise<ApplicationEvent>;
  deleteEvent(id: string): Promise<void>;
  saveApplicationSnapshot(
    applicationId: string,
    input: ApplicationSnapshotInput
  ): Promise<ApplicationSnapshot>;
  deleteApplicationSnapshot(applicationId: string): Promise<void>;
  getResumeBlob(snapshot: ApplicationSnapshot): Promise<Blob>;
}
