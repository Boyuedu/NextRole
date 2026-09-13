import type { ApplicationSection } from "@/types";

export const ACTIVE_STAGES = [
  "Saved",
  "Preparing",
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

export const DEFAULT_STAGES = [...ACTIVE_STAGES, ...TERMINAL_STAGES] as const;

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

const TERMINAL_STAGE_LOOKUP = new Set(
  TERMINAL_STAGES.map((stage) => stage.toLowerCase())
);
const ACTIVE_STAGE_LOOKUP = new Set(
  ACTIVE_STAGES.map((stage) => stage.toLowerCase())
);

export function getStatusForStage(stage: string): ApplicationSection {
  const normalized = stage.trim().toLowerCase();
  if (!normalized) return "active";
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

export function isInterviewingStage(stage: string) {
  return /interview|oa/i.test(stage);
}

export function isOfferStage(stage: string) {
  return /offer/i.test(stage) && !/declined|rejected/i.test(stage);
}
