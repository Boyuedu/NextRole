"use client";

import { EventSheet } from "@/components/timeline/event-sheet";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/use-i18n";
import { useTracker } from "@/hooks/use-tracker";
import {
  emptyEventInput,
  eventToInput,
  isFutureEvent,
  isInterviewEvent,
  sortEvents,
} from "@/lib/events";
import { formatEventDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Application, ApplicationEvent } from "@/types";
import { PlusIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export function ApplicationTimeline({
  application,
}: {
  application: Application;
}) {
  const { t, option, locale } = useI18n();
  const { events, createEvent, updateEvent, deleteEvent } = useTracker();
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<ApplicationEvent | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ApplicationEvent | null>(
    null
  );
  const items = useMemo(
    () =>
      sortEvents(
        events.filter((event) => event.applicationId === application.id)
      ),
    [application.id, events]
  );

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          {t("timeline")}
        </h2>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <PlusIcon />
          {t("addEvent")}
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-4 py-8">
          <p className="text-sm font-medium text-foreground">
            {t("noTimelineEvents")}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("noTimelineEventsHint")}
          </p>
        </div>
      ) : (
        <ol className="relative ml-2 border-l border-zinc-200 pl-5">
          {items.map((event) => {
            const future = isFutureEvent(event.date, event.time);
            const title =
              !event.title.trim() || event.title.trim() === event.eventType
                ? option("eventTypes", event.eventType) || event.title
                : event.title;
            const interview = isInterviewEvent(event.eventType, event.title);

            return (
              <li key={event.id} className="relative pb-5 last:pb-0">
                <span
                  className={cn(
                    "absolute top-1.5 -left-[27px] size-2.5 rounded-full border border-zinc-400 bg-white",
                    !future && "bg-zinc-700 border-zinc-700"
                  )}
                />
                <div className="text-xs text-muted-foreground">
                  {formatEventDateTime(event.date, event.time, locale)}
                </div>
                <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "text-sm font-medium text-foreground",
                        future && "text-zinc-600"
                      )}
                    >
                      {title}
                    </p>
                    {interview &&
                    (event.interviewer ||
                      event.interviewType ||
                      event.method) ? (
                      <p className="mt-1 break-words text-sm text-zinc-600">
                        {[
                          event.interviewer
                            ? `${t("interviewer")}: ${event.interviewer}`
                            : null,
                          event.interviewType
                            ? `${t("interviewType")}: ${event.interviewType}`
                            : null,
                          event.method
                            ? `${t("method")}: ${event.method}`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    ) : null}
                    {event.notes ? (
                      <p className="mt-1 break-words whitespace-pre-wrap text-sm text-zinc-600">
                        {event.notes}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => setEditing(event)}
                    >
                      {t("edit")}
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => setPendingDelete(event)}
                    >
                      {t("delete")}
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <EventSheet
        open={addOpen}
        onOpenChange={setAddOpen}
        title={t("addEvent")}
        description={t("addEventDescription")}
        currentStage={application.stage}
        currentStatus={application.status}
        defaultApplyOutcome
        submitLabel={t("addEvent")}
        onSubmit={async (value, options) => {
          try {
            await createEvent(application.id, value, options);
            setAddOpen(false);
            toast.success(t("eventAdded"));
          } catch {
            toast.error(t("couldNotSaveEvent"));
          }
        }}
      />

      <EventSheet
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        title={t("editEvent")}
        description={t("addEventDescription")}
        initialValue={editing ? eventToInput(editing) : emptyEventInput()}
        currentStage={application.stage}
        currentStatus={application.status}
        defaultApplyOutcome={false}
        submitLabel={t("saveChanges")}
        onSubmit={async (value, options) => {
          if (!editing) return;
          try {
            await updateEvent(editing.id, value, options);
            setEditing(null);
            toast.success(t("eventUpdated"));
          } catch {
            toast.error(t("couldNotSaveEvent"));
          }
        }}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title={t("deleteEventTitle")}
        description={t("deleteEventDescription")}
        confirmLabel={t("delete")}
        onConfirm={async () => {
          if (!pendingDelete) return;
          try {
            await deleteEvent(pendingDelete.id);
            toast.success(t("eventDeleted"));
          } catch {
            toast.error(t("failedToDeleteEvent"));
          }
        }}
      />
    </section>
  );
}
