"use client";

import { LabeledSelect } from "@/components/applications/category-selector";
import { useI18n } from "@/hooks/use-i18n";
import { DEFAULT_STAGES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function StageSelect({
  stage,
  onChange,
  className,
  disabled,
}: {
  stage: string;
  onChange: (stage: string) => void;
  className?: string;
  disabled?: boolean;
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

  return (
    <div
      className={cn("relative z-10 min-w-0", className)}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <LabeledSelect
        value={stage}
        allowEmpty={false}
        aria-label={t("stage")}
        disabled={disabled}
        onChange={(next) => {
          if (next && next !== stage) onChange(next);
        }}
        options={options}
        triggerClassName="h-7 max-w-[160px] border-zinc-200 bg-white px-2 text-xs"
      />
    </div>
  );
}
