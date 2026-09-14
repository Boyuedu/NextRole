"use client";

import { LabeledSelect } from "@/components/applications/category-selector";
import { StageDot } from "@/components/applications/status-badge";
import { useI18n } from "@/hooks/use-i18n";
import { DEFAULT_STAGES } from "@/lib/constants";
import { getStageStyle } from "@/lib/stage-style";
import { cn } from "@/lib/utils";

export function StageSelect({
  stage,
  onChange,
  className,
  disabled,
  allowEmpty = false,
  emptyLabel,
  triggerClassName,
  size = "sm",
}: {
  stage: string;
  onChange: (stage: string) => void;
  className?: string;
  disabled?: boolean;
  allowEmpty?: boolean;
  emptyLabel?: string;
  triggerClassName?: string;
  size?: "sm" | "default";
}) {
  const { t, option } = useI18n();
  const options = [
    ...DEFAULT_STAGES.map((value) => ({
      id: value,
      name: option("stages", value),
    })),
    ...(stage && !(DEFAULT_STAGES as readonly string[]).includes(stage)
      ? [{ id: stage, name: option("stages", stage) || stage }]
      : []),
  ];
  const selectedStyle = stage ? getStageStyle(stage) : null;

  return (
    <div
      className={cn("relative min-w-0 w-fit max-w-full", className)}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <LabeledSelect
        value={stage || null}
        allowEmpty={allowEmpty}
        emptyLabel={emptyLabel}
        aria-label={t("stage")}
        disabled={disabled}
        size={size}
        onChange={(next) => {
          const value = next ?? "";
          if (value !== stage) onChange(value);
        }}
        options={options}
        triggerClassName={cn(
          size === "sm" ? "h-7 max-w-[160px] px-2 text-xs" : undefined,
          selectedStyle?.badge,
          triggerClassName
        )}
        renderTrigger={(_selected, label) => (
          <>
            {stage ? <StageDot stage={stage} /> : null}
            <span className="min-w-0 truncate">{label}</span>
          </>
        )}
        renderOption={(item) => (
          <span className="flex items-center gap-1.5">
            <StageDot stage={item.id} />
            {item.name}
          </span>
        )}
      />
    </div>
  );
}
