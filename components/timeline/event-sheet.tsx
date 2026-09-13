"use client";

import { EventForm } from "@/components/timeline/event-form";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useI18n } from "@/hooks/use-i18n";
import { emptyEventInput } from "@/lib/events";
import type {
  ApplicationEventInput,
  ApplicationSection,
  EventWriteOptions,
} from "@/types";

export function EventSheet({
  open,
  onOpenChange,
  title,
  description,
  initialValue,
  currentStage,
  currentStatus,
  defaultApplyOutcome,
  submitLabel,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  initialValue?: ApplicationEventInput;
  currentStage: string;
  currentStatus: ApplicationSection;
  defaultApplyOutcome: boolean;
  submitLabel: string;
  onSubmit: (
    value: ApplicationEventInput,
    options: EventWriteOptions
  ) => Promise<void>;
}) {
  const { t } = useI18n();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        closeLabel={t("close")}
        className="w-full gap-0 overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-lg"
      >
        <SheetHeader className="border-b border-border">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <div className="p-4">
          {open ? (
            <EventForm
              initialValue={initialValue ?? emptyEventInput()}
              currentStage={currentStage}
              currentStatus={currentStatus}
              defaultApplyOutcome={defaultApplyOutcome}
              submitLabel={submitLabel}
              onCancel={() => onOpenChange(false)}
              onSubmit={onSubmit}
            />
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
