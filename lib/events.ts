import { DEFAULT_STAGES, getStatusForStage } from "@/lib/constants";
import { todayInputValue } from "@/lib/format";
import type { ApplicationEvent, ApplicationSection } from "@/types";

const EVENT_STAGE_MAP: Record<string, string> = {
  Saved: "Saved",
  "Resume Prepared": "Preparing",
  "Application Submitted": "Applied",
  OA: "OA",
  "Final Interview": "Final Interview",
  Offer: "Offer",
  Rejected: "Rejected",
  Withdrawn: "Withdrawn",
  "Position Closed": "Position Closed",
};

export function emptyEventInput(): {
  eventType: string;
  title: string;
  date: string;
  time: string;
  notes: string;
  interviewer: string;
  interviewType: string;
  method: string;
} {
  return {
    eventType: "Application Submitted",
    title: "Application Submitted",
    date: todayInputValue(),
    time: "",
    notes: "",
    interviewer: "",
    interviewType: "",
    method: "",
  };
}

export function eventToInput(event: ApplicationEvent) {
  return {
    eventType: event.eventType,
    title: event.title,
    date: event.date,
    time: event.time ?? "",
    notes: event.notes ?? "",
    interviewer: event.interviewer ?? "",
    interviewType: event.interviewType ?? "",
    method: event.method ?? "",
  };
}

export function suggestedStage(eventType: string, title: string) {
  const trimmed = title.trim();
  if (DEFAULT_STAGES.includes(trimmed as (typeof DEFAULT_STAGES)[number])) {
    return trimmed;
  }
  return EVENT_STAGE_MAP[eventType] ?? null;
}

export function suggestedStatus(
  eventType: string,
  title: string
): ApplicationSection | null {
  const stage = suggestedStage(eventType, title);
  if (stage) return getStatusForStage(stage);
  if (eventType === "Rejected" || eventType === "Withdrawn") return "ended";
  return null;
}

export function isInterviewEvent(eventType: string, title: string) {
  return /interview/i.test(`${eventType} ${title}`);
}

export function sortEvents(events: ApplicationEvent[]) {
  return [...events].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    if (a.time && b.time && a.time !== b.time) {
      return a.time < b.time ? 1 : -1;
    }
    if (a.time && !b.time) return -1;
    if (!a.time && b.time) return 1;
    if (a.createdAt !== b.createdAt) {
      return a.createdAt < b.createdAt ? 1 : -1;
    }
    return a.id < b.id ? 1 : -1;
  });
}

export function isFutureEvent(date: string, time: string | null) {
  const today = todayInputValue();
  if (date > today) return true;
  if (date < today) return false;
  if (!time) return false;
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return time > `${hours}:${minutes}`;
}
