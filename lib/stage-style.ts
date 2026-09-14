export type StageStyle = {
  badge: string;
  dot: string;
};

const FALLBACK_STAGE_STYLE: StageStyle = {
  badge: "border-zinc-200 bg-zinc-50 text-zinc-700",
  dot: "bg-zinc-400",
};

const STAGE_STYLES: Record<string, StageStyle> = {
  Saved: {
    badge: "border-zinc-200 bg-zinc-50 text-zinc-700",
    dot: "bg-zinc-400",
  },
  Preparing: {
    badge: "border-amber-200 bg-amber-50 text-amber-800",
    dot: "bg-amber-500",
  },
  Applied: {
    badge: "border-blue-200 bg-blue-50 text-blue-800",
    dot: "bg-blue-500",
  },
  OA: {
    badge: "border-violet-200 bg-violet-50 text-violet-800",
    dot: "bg-violet-500",
  },
  "Interview 1": {
    badge: "border-cyan-200 bg-cyan-50 text-cyan-800",
    dot: "bg-cyan-500",
  },
  "Interview 2": {
    badge: "border-indigo-200 bg-indigo-50 text-indigo-800",
    dot: "bg-indigo-500",
  },
  "Interview 3": {
    badge: "border-purple-200 bg-purple-50 text-purple-800",
    dot: "bg-purple-500",
  },
  "Final Interview": {
    badge: "border-rose-200 bg-rose-50 text-rose-800",
    dot: "bg-rose-500",
  },
  Offer: {
    badge: "border-emerald-200 bg-emerald-50 text-emerald-800",
    dot: "bg-emerald-600",
  },
  Rejected: {
    badge: "border-red-200 bg-red-50 text-red-700",
    dot: "bg-red-500",
  },
  Withdrawn: {
    badge: "border-slate-200 bg-slate-50 text-slate-600",
    dot: "bg-slate-400",
  },
  "Position Closed": {
    badge: "border-slate-200 bg-slate-100 text-slate-700",
    dot: "bg-slate-500",
  },
  "Offer Declined": {
    badge: "border-orange-200 bg-orange-50 text-orange-800",
    dot: "bg-orange-500",
  },
  "Not Interested": {
    badge: "border-stone-200 bg-stone-50 text-stone-700",
    dot: "bg-stone-400",
  },
};

export function getStageStyle(stage: string): StageStyle {
  return STAGE_STYLES[stage] ?? FALLBACK_STAGE_STYLE;
}
