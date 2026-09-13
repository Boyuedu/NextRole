"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
} from "@/components/ui/select";
import { useI18n } from "@/hooks/use-i18n";
import { cn } from "@/lib/utils";
import { PlusIcon } from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import { toast } from "sonner";

const NONE = "__none__";
const CREATE = "__create__";

export function LabeledSelect({
  value,
  onChange,
  options,
  placeholder,
  emptyLabel,
  allowEmpty = true,
  className,
  triggerClassName,
  id,
  disabled,
  createLabel,
  onCreate,
  "aria-label": ariaLabel,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
  options: { id: string; name: string }[];
  placeholder?: string;
  emptyLabel?: string;
  allowEmpty?: boolean;
  className?: string;
  triggerClassName?: string;
  id?: string;
  disabled?: boolean;
  createLabel?: string;
  onCreate?: (name: string) => Promise<string>;
  "aria-label"?: string;
}) {
  const { t } = useI18n();
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const selected = options.find((option) => option.id === value);
  const label = selected?.name ?? emptyLabel ?? placeholder ?? "";
  const canCreate = Boolean(createLabel && onCreate);

  async function saveCreated() {
    const trimmed = draft.trim();
    if (!trimmed || !onCreate) return;
    setBusy(true);
    try {
      const id = await onCreate(trimmed);
      onChange(id);
      setDraft("");
      setCreating(false);
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : "";
      if (message.includes("required")) {
        toast.error(t("nameRequired"));
      } else if (
        message.includes("already exists") ||
        message.includes("duplicate")
      ) {
        toast.error(t("duplicateName"));
      } else {
        toast.error(t("couldNotSave"));
      }
    } finally {
      setBusy(false);
    }
  }

  function handleCreateKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      event.stopPropagation();
      void saveCreated();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setCreating(false);
      setDraft("");
    }
  }

  if (creating && canCreate) {
    return (
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          id={id}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleCreateKey}
          placeholder={createLabel}
          aria-label={createLabel}
          className={cn("h-8", triggerClassName)}
          autoFocus
          disabled={busy}
        />
        <div className="flex shrink-0 gap-2">
          <Button
            type="button"
            size="sm"
            disabled={busy || !draft.trim()}
            onClick={() => void saveCreated()}
          >
            {busy ? t("saving") : t("save")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => {
              setCreating(false);
              setDraft("");
            }}
          >
            {t("cancel")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Select
      value={value ?? NONE}
      disabled={disabled}
      onValueChange={(next) => {
        if (next === CREATE) {
          setCreating(true);
          setDraft("");
          return;
        }
        onChange(next === NONE ? null : String(next));
      }}
    >
      <SelectTrigger
        id={id}
        aria-label={ariaLabel ?? placeholder}
        className={cn("w-full", className, triggerClassName)}
      >
        <span className="flex-1 truncate text-left">{label}</span>
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} align="start">
        {allowEmpty ? (
          <SelectItem value={NONE}>{emptyLabel ?? placeholder ?? ""}</SelectItem>
        ) : null}
        {options.map((option) => (
          <SelectItem key={option.id} value={option.id}>
            {option.name}
          </SelectItem>
        ))}
        {canCreate ? (
          <SelectSeparator />
        ) : null}
        {canCreate ? (
          <SelectItem value={CREATE}>
            <span className="flex items-center gap-1.5">
              <PlusIcon className="size-3.5" />
              {createLabel}
            </span>
          </SelectItem>
        ) : null}
      </SelectContent>
    </Select>
  );
}
