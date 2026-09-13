"use client";

import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/hooks/use-i18n";
import { cn } from "@/lib/utils";
import type { ApplicationSection } from "@/types";

export function StatusBadge({ status }: { status: ApplicationSection }) {
  const { t } = useI18n();
  return (
    <Badge
      variant="outline"
      className={cn(
        status === "active"
          ? "border-blue-100 bg-blue-50 text-blue-700"
          : "border-zinc-200 bg-zinc-100 text-zinc-600"
      )}
    >
      {status === "active" ? t("active") : t("ended")}
    </Badge>
  );
}

export function StageBadge({
  stage,
  status,
}: {
  stage: string;
  status: ApplicationSection;
}) {
  const { option } = useI18n();
  return (
    <Badge variant="outline" className={cn("font-medium", stageTone(stage, status))}>
      {option("stages", stage)}
    </Badge>
  );
}

function stageTone(stage: string, status: ApplicationSection) {
  const value = stage.toLowerCase();
  if (/rejected/.test(value)) {
    return "border-red-100 bg-red-50 text-red-700";
  }
  if (
    status === "ended" ||
    /withdrawn|declined|closed|not interested|no response/.test(value)
  ) {
    return "border-zinc-200 bg-zinc-100 text-zinc-600";
  }
  if (/offer/.test(value)) {
    return "border-emerald-100 bg-emerald-50 text-emerald-700";
  }
  if (/interview/.test(value)) {
    return "border-violet-100 bg-violet-50 text-violet-700";
  }
  if (/oa/.test(value)) {
    return "border-indigo-100 bg-indigo-50 text-indigo-700";
  }
  if (/applied/.test(value)) {
    return "border-blue-100 bg-blue-50 text-blue-700";
  }
  return "border-zinc-200 bg-zinc-100 text-zinc-600";
}
