"use client";

import { StageSelect } from "@/components/applications/stage-select";
import { StatusBadge } from "@/components/applications/status-badge";
import { TagPill } from "@/components/applications/tag-pill";
import { useI18n } from "@/hooks/use-i18n";
import { useTracker } from "@/hooks/use-tracker";
import { applicationFunctionLabel } from "@/lib/classifications";
import { formatShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Application } from "@/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type MouseEvent } from "react";
import { toast } from "sonner";

async function changeStage(
  setStage: (id: string, stage: string) => Promise<void>,
  id: string,
  stage: string,
  t: (key: "stageUpdated" | "failedToSaveApplication") => string,
  setPending: (value: boolean) => void
) {
  setPending(true);
  try {
    await setStage(id, stage);
    toast.success(t("stageUpdated"));
  } catch {
    toast.error(t("failedToSaveApplication"));
  } finally {
    setPending(false);
  }
}

function isInteractiveTarget(target: EventTarget | null) {
  return (
    target instanceof Element &&
    Boolean(
      target.closest(
        "a, button, input, textarea, select, [role='combobox'], [data-slot='select-trigger']"
      )
    )
  );
}

function useApplicationHref(applicationId: string) {
  const router = useRouter();
  const href = `/applications/${applicationId}`;

  function openDetail(event: MouseEvent<HTMLElement>) {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (isInteractiveTarget(event.target)) return;
    router.push(href);
  }

  return { href, openDetail };
}

export function ApplicationRow({
  application,
  hideCompany = false,
}: {
  application: Application;
  hideCompany?: boolean;
}) {
  const { t, locale, option } = useI18n();
  const { setStage, categories } = useTracker();
  const [pending, setPending] = useState(false);
  const { href, openDetail } = useApplicationHref(application.id);
  const functionName =
    applicationFunctionLabel(application, categories, option) || t("unassigned");

  return (
    <tr
      className="cursor-pointer border-b border-border last:border-0 hover:bg-zinc-50"
      onClick={openDetail}
    >
      {hideCompany ? null : (
        <td className="max-w-[180px] px-4 py-2.5 font-medium text-foreground">
          <Link
            href={href}
            className="block truncate hover:underline"
            title={application.company}
          >
            {application.company}
          </Link>
        </td>
      )}
      <td className="max-w-[240px] px-4 py-2.5 text-zinc-700">
        <Link
          href={href}
          className={cn(
            "block truncate hover:underline",
            hideCompany && "font-medium text-foreground"
          )}
          title={application.position}
        >
          {application.position}
        </Link>
        <CompactTags tagIds={application.tagIds} />
      </td>
      <td
        className="max-w-[140px] truncate px-4 py-2.5 text-zinc-600"
        title={application.region || t("unassigned")}
      >
        {application.region || t("unassigned")}
      </td>
      <td
        className="max-w-[160px] truncate px-4 py-2.5 text-zinc-600"
        title={functionName}
      >
        {functionName}
      </td>
      <td className="px-4 py-2.5 whitespace-nowrap text-zinc-600">
        {formatShortDate(application.appliedDate, locale)}
      </td>
      <td className="cursor-auto px-4 py-2.5">
        <StageSelect
          stage={application.stage}
          disabled={pending}
          onChange={(stage) =>
            void changeStage(setStage, application.id, stage, t, setPending)
          }
        />
      </td>
      <td className="px-4 py-2.5">
        <StatusBadge status={application.status} />
      </td>
    </tr>
  );
}

export function ApplicationCard({
  application,
  hideCompany = false,
}: {
  application: Application;
  hideCompany?: boolean;
}) {
  const { t, locale, option } = useI18n();
  const { setStage, categories } = useTracker();
  const [pending, setPending] = useState(false);
  const { href, openDetail } = useApplicationHref(application.id);
  const functionName =
    applicationFunctionLabel(application, categories, option) || t("unassigned");

  return (
    <div
      className="cursor-pointer rounded-xl border border-border bg-white p-4 hover:bg-zinc-50"
      onClick={openDetail}
    >
      <div className="flex items-start justify-between gap-3">
        <Link href={href} className="min-w-0">
          {hideCompany ? null : (
            <div
              className="truncate font-medium text-foreground"
              title={application.company}
            >
              {application.company}
            </div>
          )}
          <div
            className={cn(
              "truncate",
              hideCompany
                ? "font-medium text-foreground hover:underline"
                : "mt-0.5 text-sm text-zinc-600 hover:underline"
            )}
            title={application.position}
          >
            {application.position}
          </div>
          <CompactTags tagIds={application.tagIds} />
        </Link>
        <StatusBadge status={application.status} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
        <span>{application.region || t("unassigned")}</span>
        <span>·</span>
        <span>{functionName}</span>
        <span>·</span>
        <span>{formatShortDate(application.appliedDate, locale)}</span>
      </div>
      <div className="mt-3 cursor-auto">
        <StageSelect
          stage={application.stage}
          disabled={pending}
          onChange={(stage) =>
            void changeStage(setStage, application.id, stage, t, setPending)
          }
        />
      </div>
    </div>
  );
}

function CompactTags({ tagIds }: { tagIds: string[] }) {
  const { t } = useI18n();
  const { tags } = useTracker();
  const named = tagIds
    .map((id) => tags.find((tag) => tag.id === id))
    .filter((tag): tag is NonNullable<typeof tag> => Boolean(tag));

  if (named.length === 0) return null;

  const visible = named.slice(0, 2);
  const extra = named.length - visible.length;

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1">
      {visible.map((tag) => (
        <TagPill
          key={tag.id}
          name={tag.name}
          className="px-1.5 py-0 text-[10px] leading-4"
        />
      ))}
      {extra > 0 ? (
        <span className="text-[10px] text-muted-foreground">
          {t("moreCount", { count: extra })}
        </span>
      ) : null}
    </div>
  );
}
