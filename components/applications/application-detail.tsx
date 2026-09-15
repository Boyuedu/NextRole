"use client";

import { ApplicationSheet } from "@/components/applications/application-sheet";
import { ApplicationSnapshotSection } from "@/components/snapshot/application-snapshot";
import { ApplicationTimeline } from "@/components/timeline/application-timeline";
import { StageBadge, StatusBadge } from "@/components/applications/status-badge";
import { TagPill } from "@/components/applications/tag-pill";
import { CloudMessage } from "@/components/auth/cloud-message";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/use-i18n";
import { useIsClient } from "@/hooks/use-is-client";
import { useTracker } from "@/hooks/use-tracker";
import { applicationToInput } from "@/lib/application-input";
import { applicationFunctionLabel } from "@/lib/classifications";
import { copyText } from "@/lib/copy";
import { formatLongDate } from "@/lib/format";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

export function ApplicationDetailPage() {
  const { t, option, locale } = useI18n();
  const mounted = useIsClient();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const {
    applications,
    tags,
    categories,
    ready,
    loadError,
    refresh,
    updateApplication,
    deleteApplication,
    setArchived,
  } = useTracker();
  const application = applications.find((item) => item.id === params.id);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!ready || !mounted) {
    return <p className="text-sm text-muted-foreground">{t("loading")}</p>;
  }

  if (loadError) {
    return (
      <CloudMessage
        titleKey="cloudUnavailable"
        descriptionKey="cloudUnavailableDescription"
        onRetry={() => void refresh()}
      />
    );
  }

  if (!application) {
    if (removing) {
      return <p className="text-sm text-muted-foreground">{t("deleting")}</p>;
    }
    return (
      <div className="mx-auto max-w-3xl">
        <p className="text-sm text-muted-foreground">{t("applicationNotFound")}</p>
        <Button
          className="mt-4"
          variant="outline"
          nativeButton={false}
          render={<Link href="/" />}
        >
          {t("backToApplications")}
        </Button>
      </div>
    );
  }

  const functionName =
    applicationFunctionLabel(application, categories, option) || t("unassigned");

  return (
    <div className="mx-auto grid max-w-3xl gap-8">
      <div>
        <Link
          href={application.archived ? "/?archived=1" : "/"}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" />
          {t("applications")}
        </Link>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {application.company}
            </h1>
            <p className="mt-1 text-zinc-600">{application.position}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {application.region ? (
                <ClassificationChip>{application.region}</ClassificationChip>
              ) : null}
              {application.functionId ? (
                <ClassificationChip>
                  {functionName}
                </ClassificationChip>
              ) : null}
              <StageBadge stage={application.stage} />
              <StatusBadge status={application.status} />
            </div>
            {application.tagIds.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {application.tagIds.map((tagId) => {
                  const tag = tags.find((item) => item.id === tagId);
                  return tag ? <TagPill key={tag.id} name={tag.name} /> : null;
                })}
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => setEditOpen(true)}
            >
              {t("edit")}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={async () => {
                const archivedNext = !application.archived;
                setBusy(true);
                try {
                  await setArchived(application.id, archivedNext);
                  toast.success(
                    archivedNext ? t("archivedToast") : t("restoredToast")
                  );
                } catch {
                  toast.error(t("failedToSaveApplication"));
                } finally {
                  setBusy(false);
                }
              }}
            >
              {application.archived ? t("restore") : t("archive")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={busy}
              onClick={() => setDeleteOpen(true)}
            >
              {t("delete")}
            </Button>
          </div>
        </div>
      </div>

      <section className="grid gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          {t("basicInformation")}
        </h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          <DetailItem label={t("company")} value={application.company} />
          <DetailItem label={t("position")} value={application.position} />
          <DetailItem label={t("location")} value={application.location} />
          <DetailItem
            label={t("region")}
            value={application.region || t("unassigned")}
          />
          <DetailItem
            label={t("function")}
            value={functionName}
          />
          <DetailItem
            label={t("jobType")}
            value={option("jobTypes", application.jobType)}
          />
          <DetailItem label={t("jobId")} value={application.jobId} />
          <DetailItem
            label={t("jobUrl")}
            value={
              application.jobUrl ? (
                <a
                  href={application.jobUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-blue-700 hover:underline"
                >
                  {application.jobUrl}
                </a>
              ) : null
            }
          />
          <DetailItem label={t("source")} value={application.source} />
        </dl>
      </section>

      <section className="grid gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          {t("applicationInformation")}
        </h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          <DetailItem
            label={t("appliedDate")}
            value={formatLongDate(application.appliedDate, locale)}
          />
          <DetailItem
            label={t("currentStage")}
            value={<StageBadge stage={application.stage} />}
          />
          <DetailItem
            label={t("status")}
            value={<StatusBadge status={application.status} />}
          />
          <DetailItem label={t("resumeUsed")} value={application.resumeUsed} />
          <DetailItem
            label={t("referralCode")}
            value={
              application.referralCode ? (
                <ReferralCodeValue code={application.referralCode} />
              ) : null
            }
          />
        </dl>
      </section>

      <ApplicationSnapshotSection application={application} />

      <ApplicationTimeline application={application} />

      <section className="grid gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">{t("notes")}</h2>
        <p className="whitespace-pre-wrap text-sm text-zinc-700">
          {application.notes || "—"}
        </p>
      </section>

      <ApplicationSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        title={t("editApplication")}
        description={t("editApplicationDescription")}
        initialValue={applicationToInput(application)}
        submitLabel={t("saveChanges")}
        onSubmit={async (value) => {
          try {
            await updateApplication(application.id, value);
            setEditOpen(false);
            toast.success(t("applicationUpdated"));
          } catch {
            toast.error(t("failedToSaveApplication"));
          }
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("deleteApplicationTitle")}
        description={t("deleteApplicationDescription")}
        confirmLabel={removing ? t("deleting") : t("delete")}
        onConfirm={async () => {
          try {
            setRemoving(true);
            await deleteApplication(application.id);
            toast.success(t("applicationDeleted"));
            router.push("/");
          } catch {
            setRemoving(false);
            toast.error(t("failedToDeleteApplication"));
          }
        }}
      />
    </div>
  );
}

function ReferralCodeValue({ code }: { code: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  return (
    <span className="inline-flex max-w-full items-center gap-2">
      <span className="min-w-0 break-all">{code}</span>
      <Button
        type="button"
        size="xs"
        variant="ghost"
        className="text-muted-foreground"
        onClick={() => {
          void copyText(code);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? t("copied") : t("copy")}
      </Button>
    </span>
  );
}

function ClassificationChip({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-zinc-300 bg-white px-2.5 py-0.5 text-xs text-zinc-700">
      {children}
    </span>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value?: ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm text-foreground">{value || "—"}</dd>
    </div>
  );
}
