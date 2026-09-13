export type ApplicationSection = "active" | "ended";
export type CategoryType = "region" | "function";
export type FunctionKey =
  | "rd"
  | "algorithm"
  | "product"
  | "marketing"
  | "sales"
  | "operations"
  | "design"
  | "research"
  | "business"
  | "other";

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  isSystem: boolean;
  translationKey: FunctionKey | null;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Application {
  id: string;
  company: string;
  companyId: string | null;
  position: string;
  location: string | null;
  regionId: string | null;
  functionId: string | null;
  region: string | null;
  functionCategory: string | null;
  tagIds: string[];
  status: ApplicationSection;
  stage: string;
  jobType: string | null;
  appliedDate: string | null;
  jobUrl: string | null;
  jobId: string | null;
  resumeUsed: string | null;
  source: string | null;
  referralCode: string | null;
  notes: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationInput {
  company: string;
  companyId: string;
  position: string;
  location: string;
  regionId: string;
  functionId: string;
  tagIds: string[];
  status: ApplicationSection;
  stage: string;
  jobType: string;
  appliedDate: string;
  jobUrl: string;
  jobId: string;
  resumeUsed: string;
  source: string;
  referralCode: string;
  notes: string;
}

export interface ApplicationListFilters {
  search: string;
  status: ApplicationSection | null;
  archived: boolean;
  regionId: string | null;
  functionId: string | null;
  stage: string | null;
  tagIds: string[];
}

export interface ApplicationEvent {
  id: string;
  applicationId: string;
  eventType: string;
  title: string;
  date: string;
  time: string | null;
  notes: string | null;
  interviewer: string | null;
  interviewType: string | null;
  method: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationEventInput {
  eventType: string;
  title: string;
  date: string;
  time: string;
  notes: string;
  interviewer: string;
  interviewType: string;
  method: string;
}

export interface EventWriteOptions {
  stage?: string | null;
  status?: ApplicationSection | null;
}

export interface ApplicationSnapshot {
  id: string;
  applicationId: string;
  jobDescription: string | null;
  referralCode: string | null;
  resumeFileName: string | null;
  resumeStoragePath: string | null;
  resumeMimeType: string | null;
  resumeFileSize: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationSnapshotInput {
  jobDescription: string;
  referralCode: string;
  resumeFile: File | null;
  keepExistingResume: boolean;
}
