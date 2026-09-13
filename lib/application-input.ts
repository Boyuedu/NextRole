import { toDateInputValue, todayInputValue } from "@/lib/format";
import type { Application, ApplicationInput } from "@/types";

export function emptyApplicationInput(): ApplicationInput {
  return {
    company: "",
    companyId: "",
    position: "",
    location: "",
    regionId: "",
    functionId: "",
    tagIds: [],
    status: "active",
    stage: "Saved",
    jobType: "",
    appliedDate: todayInputValue(),
    jobUrl: "",
    jobId: "",
    resumeUsed: "",
    source: "",
    referralCode: "",
    notes: "",
  };
}

export function applicationToInput(application: Application): ApplicationInput {
  return {
    company: application.company,
    companyId: application.companyId ?? "",
    position: application.position,
    location: application.location ?? "",
    regionId: application.regionId ?? "",
    functionId: application.functionId ?? "",
    tagIds: [...application.tagIds],
    status: application.status,
    stage: application.stage,
    jobType: application.jobType ?? "",
    appliedDate: toDateInputValue(application.appliedDate),
    jobUrl: application.jobUrl ?? "",
    jobId: application.jobId ?? "",
    resumeUsed: application.resumeUsed ?? "",
    source: application.source ?? "",
    referralCode: application.referralCode ?? "",
    notes: application.notes ?? "",
  };
}
