"use client";

import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/hooks/use-i18n";
import { getStageStyle } from "@/lib/stage-style";
import { getStatusStyle } from "@/lib/status-style";
import { statusLabelKey } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { ApplicationSection } from "@/types";

export function StatusBadge({ status }: { status: ApplicationSection }) {
  const { t } = useI18n();
  return (
    <Badge
      variant="outline"
      className={cn("font-medium", getStatusStyle(status).badge)}
    >
      {t(statusLabelKey(status))}
    </Badge>
  );
}

export function StageDot({
  stage,
  className,
}: {
  stage: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "size-1.5 shrink-0 rounded-full",
        getStageStyle(stage).dot,
        className
      )}
    />
  );
}

export function StageBadge({ stage }: { stage: string }) {
  const { option } = useI18n();
  return (
    <Badge
      variant="outline"
      className={cn("font-medium", getStageStyle(stage).badge)}
    >
      <StageDot stage={stage} />
      {option("stages", stage)}
    </Badge>
  );
}
