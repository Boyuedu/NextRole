import type { ApplicationSection } from "@/types";

export const NOT_STARTED_STAGES = ["Saved", "Preparing"] as const;

export const ACTIVE_STAGES = [
  "Applied",
  "OA",
  "Interview 1",
  "Interview 2",
  "Interview 3",
  "Final Interview",
  "Offer",
] as const;

export const TERMINAL_STAGES = [
  "Rejected",
  "Withdrawn",
  "Position Closed",
  "Offer Declined",
  "Not Interested",
] as const;

export const DEFAULT_STAGES = [
  ...NOT_STARTED_STAGES,
  ...ACTIVE_STAGES,
  ...TERMINAL_STAGES,
] as const;

export const APPLICATION_STATUSES = [
  "not_started",
  "active",
  "ended",
] as const;

export const JOB_TYPES = [
  "Full-time",
  "Internship",
  "New Grad",
  "Contract",
  "Part-time",
] as const;

export const DEFAULT_EVENT_TYPES = [
  "Saved",
  "Resume Prepared",
  "Application Submitted",
  "Resume Screening",
  "OA",
  "Recruiter Contact",
  "Interview",
  "Final Interview",
  "Offer",
  "Rejected",
  "Withdrawn",
  "Position Closed",
  "Follow-up",
  "Other",
] as const;

export const APPLIED_STATS_STAGES = ["Applied", "OA"] as const;

export const INTERVIEWING_STATS_STAGES = [
  "Interview 1",
  "Interview 2",
  "Interview 3",
  "Final Interview",
] as const;

const NOT_STARTED_STAGE_LOOKUP = new Set(
  NOT_STARTED_STAGES.map((stage) => stage.toLowerCase())
);
const TERMINAL_STAGE_LOOKUP = new Set(
  TERMINAL_STAGES.map((stage) => stage.toLowerCase())
);
const ACTIVE_STAGE_LOOKUP = new Set(
  ACTIVE_STAGES.map((stage) => stage.toLowerCase())
);
const APPLIED_STATS_LOOKUP = new Set<string>(APPLIED_STATS_STAGES);
const INTERVIEWING_STATS_LOOKUP = new Set<string>(INTERVIEWING_STATS_STAGES);

export function isApplicationStatus(
  value: string | null | undefined
): value is ApplicationSection {
  return value === "not_started" || value === "active" || value === "ended";
}

export function statusLabelKey(
  status: ApplicationSection
): "notStarted" | "active" | "ended" {
  if (status === "not_started") return "notStarted";
  if (status === "ended") return "ended";
  return "active";
}

export function getStatusForStage(stage: string): ApplicationSection {
  const normalized = stage.trim().toLowerCase();
  if (!normalized) return "not_started";
  if (NOT_STARTED_STAGE_LOOKUP.has(normalized)) return "not_started";
  if (TERMINAL_STAGE_LOOKUP.has(normalized)) return "ended";
  if (ACTIVE_STAGE_LOOKUP.has(normalized)) return "active";
  if (
    /rejected|withdrawn|position closed|offer declined|not interested/.test(
      normalized
    )
  ) {
    return "ended";
  }
  return "active";
}

export function isAppliedStatsStage(stage: string) {
  return APPLIED_STATS_LOOKUP.has(stage);
}

export function isInterviewingStage(stage: string) {
  return INTERVIEWING_STATS_LOOKUP.has(stage);
}

export function isOfferStage(stage: string) {
  return stage === "Offer";
}
