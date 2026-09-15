import type { ApplicationSection } from "@/types";

export type StatusStyle = {
  badge: string;
};

const FALLBACK_STATUS_STYLE: StatusStyle = {
  badge: "border-zinc-200 bg-zinc-50 text-zinc-700",
};

const STATUS_STYLES: Record<ApplicationSection, StatusStyle> = {
  not_started: {
    badge: "border-slate-200 bg-slate-50 text-slate-700",
  },
  active: {
    badge: "border-blue-200 bg-blue-50 text-blue-700",
  },
  ended: {
    badge: "border-red-200 bg-red-50 text-red-700",
  },
};

export function getStatusStyle(status: string): StatusStyle {
  if (status === "not_started" || status === "active" || status === "ended") {
    return STATUS_STYLES[status];
  }
  return FALLBACK_STATUS_STYLE;
}
