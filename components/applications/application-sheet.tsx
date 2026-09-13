"use client";

import { ApplicationForm } from "@/components/applications/application-form";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useI18n } from "@/hooks/use-i18n";
import { emptyApplicationInput } from "@/lib/application-input";
import type { ApplicationInput } from "@/types";

export function ApplicationSheet({
  open,
  onOpenChange,
  title,
  description,
  initialValue,
  submitLabel,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  initialValue?: ApplicationInput;
  submitLabel: string;
  onSubmit: (value: ApplicationInput) => Promise<void>;
}) {
  const { t } = useI18n();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        closeLabel={t("close")}
        className="w-full gap-0 overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-xl"
      >
        <SheetHeader className="border-b border-border">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <div className="p-4">
          {open ? (
            <ApplicationForm
              initialValue={initialValue ?? emptyApplicationInput()}
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
