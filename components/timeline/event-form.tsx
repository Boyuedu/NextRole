"use client";

import { LabeledSelect } from "@/components/applications/category-selector";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/hooks/use-i18n";
import { DEFAULT_EVENT_TYPES } from "@/lib/constants";
import {
  isInterviewEvent,
  suggestedStage,
  suggestedStatus,
} from "@/lib/events";
import type { ApplicationEventInput, ApplicationSection } from "@/types";
import { useMemo, useState, type FormEvent } from "react";

export function EventForm({
  initialValue,
  currentStage,
  currentStatus,
  defaultApplyOutcome,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initialValue: ApplicationEventInput;
  currentStage: string;
  currentStatus: ApplicationSection;
  defaultApplyOutcome: boolean;
  submitLabel: string;
  onSubmit: (
    value: ApplicationEventInput,
    options: { stage?: string | null; status?: ApplicationSection | null }
  ) => Promise<void>;
  onCancel: () => void;
}) {
  const { t, option } = useI18n();
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const stageSuggestion = suggestedStage(value.eventType, value.title);
  const statusSuggestion = suggestedStatus(value.eventType, value.title);
  const [updateStage, setUpdateStage] = useState(
    defaultApplyOutcome && Boolean(stageSuggestion)
  );
  const [updateStatus, setUpdateStatus] = useState(
    defaultApplyOutcome && Boolean(statusSuggestion)
  );
  const suggestionKey = `${defaultApplyOutcome}:${stageSuggestion ?? ""}:${statusSuggestion ?? ""}:${currentStage}:${currentStatus}`;
  const [lastSuggestionKey, setLastSuggestionKey] = useState(suggestionKey);
  if (suggestionKey !== lastSuggestionKey) {
    setLastSuggestionKey(suggestionKey);
    if (defaultApplyOutcome) {
      setUpdateStage(Boolean(stageSuggestion) && stageSuggestion !== currentStage);
      setUpdateStatus(
        Boolean(statusSuggestion) && statusSuggestion !== currentStatus
      );
    }
  }
  const showInterviewFields = isInterviewEvent(value.eventType, value.title);
  const stageLabel = useMemo(
    () =>
      stageSuggestion
        ? option("stages", stageSuggestion) || stageSuggestion
        : "",
    [option, stageSuggestion]
  );

  function update<K extends keyof ApplicationEventInput>(
    key: K,
    next: ApplicationEventInput[K]
  ) {
    setValue((current) => ({ ...current, [key]: next }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!value.title.trim()) {
      setError(t("titleRequired"));
      return;
    }
    if (!value.date.trim()) {
      setError(t("dateRequired"));
      return;
    }
    setError(null);
    setPending(true);
    try {
      await onSubmit(value, {
        stage: updateStage ? stageSuggestion : null,
        status: updateStatus ? statusSuggestion : null,
      });
    } catch {
      setError(t("couldNotSaveEvent"));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {error ? (
        <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-1.5">
        <Label>{t("eventType")}</Label>
        <LabeledSelect
          value={value.eventType}
          allowEmpty={false}
          onChange={(eventType) => {
            const next = eventType ?? "Other";
            setValue((current) => ({
              ...current,
              eventType: next,
              title:
                !current.title.trim() || current.title === current.eventType
                  ? next
                  : current.title,
            }));
          }}
          options={DEFAULT_EVENT_TYPES.map((type) => ({
            id: type,
            name: option("eventTypes", type),
          }))}
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="event-title">{t("title")} *</Label>
        <Input
          id="event-title"
          value={value.title}
          onChange={(event) => update("title", event.target.value)}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="event-date">{t("date")} *</Label>
          <Input
            id="event-date"
            type="date"
            value={value.date}
            onChange={(event) => update("date", event.target.value)}
            required
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="event-time">{t("time")}</Label>
          <Input
            id="event-time"
            type="time"
            value={value.time}
            onChange={(event) => update("time", event.target.value)}
          />
        </div>
      </div>

      {showInterviewFields ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="event-interviewer">{t("interviewer")}</Label>
            <Input
              id="event-interviewer"
              value={value.interviewer}
              onChange={(event) => update("interviewer", event.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="event-interview-type">{t("interviewType")}</Label>
            <Input
              id="event-interview-type"
              value={value.interviewType}
              onChange={(event) => update("interviewType", event.target.value)}
            />
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="event-method">{t("method")}</Label>
            <Input
              id="event-method"
              value={value.method}
              onChange={(event) => update("method", event.target.value)}
            />
          </div>
        </div>
      ) : null}

      <div className="grid gap-1.5">
        <Label htmlFor="event-notes">{t("notes")}</Label>
        <Textarea
          id="event-notes"
          value={value.notes}
          onChange={(event) => update("notes", event.target.value)}
          rows={4}
        />
      </div>

      {stageSuggestion && stageSuggestion !== currentStage ? (
        <label className="flex items-start gap-2 text-sm text-zinc-700">
          <Checkbox
            className="mt-0.5"
            checked={updateStage}
            onCheckedChange={(checked) => setUpdateStage(Boolean(checked))}
          />
          <span>{t("setCurrentStageTo", { stage: stageLabel })}</span>
        </label>
      ) : null}

      {statusSuggestion && statusSuggestion !== currentStatus ? (
        <label className="flex items-start gap-2 text-sm text-zinc-700">
          <Checkbox
            className="mt-0.5"
            checked={updateStatus}
            onCheckedChange={(checked) => setUpdateStatus(Boolean(checked))}
          />
          <span>
            {statusSuggestion === "ended"
              ? t("setStatusToEnded")
              : statusSuggestion === "not_started"
                ? t("setStatusToNotStarted")
                : t("setStatusToActive")}
          </span>
        </label>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? t("saving") : submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}
