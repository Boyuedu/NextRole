"use client";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/hooks/use-i18n";
import { useTracker } from "@/hooks/use-tracker";
import { copyText } from "@/lib/copy";
import { downloadBlob } from "@/lib/download";
import { resumeAccept, resumeFileError } from "@/lib/snapshots";
import type { Application, ApplicationSnapshot } from "@/types";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";

const JD_COLLAPSE_LINES = 10;
const JD_COLLAPSE_CHARS = 600;

export function ApplicationSnapshotSection({
  application,
}: {
  application: Application;
}) {
  const { t } = useI18n();
  const {
    applicationSnapshots,
    saveApplicationSnapshot,
    deleteApplicationSnapshot,
    getResumeBlob,
  } = useTracker();
  const snapshot = applicationSnapshots.find(
    (item) => item.applicationId === application.id
  );
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const replaceRef = useRef<HTMLInputElement>(null);

  async function handleResume(action: "view" | "download") {
    if (!snapshot?.resumeStoragePath || !snapshot.resumeFileName) return;
    try {
      const blob = await getResumeBlob(snapshot);
      if (action === "download") {
        downloadBlob(snapshot.resumeFileName, blob);
        return;
      }
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      toast.error(t("failedToLoadResume"));
    }
  }

  async function replaceResume(file: File) {
    const error = resumeFileError(file);
    if (error) {
      toast.error(
        error === "size" ? t("resumeFileTooLarge") : t("resumeFileTypeInvalid")
      );
      return;
    }
    try {
      await saveApplicationSnapshot(application.id, {
        jobDescription: snapshot?.jobDescription ?? "",
        referralCode: snapshot?.referralCode ?? "",
        resumeFile: file,
        keepExistingResume: false,
      });
      toast.success(t("snapshotUpdated"));
    } catch {
      toast.error(t("failedToSaveSnapshot"));
    }
  }

  return (
    <section className="grid gap-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">
          {t("applicationSnapshot")}
        </h2>
        {snapshot ? (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setFormOpen(true)}
            >
              {t("editSnapshot")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setDeleteOpen(true)}
            >
              {t("deleteSnapshot")}
            </Button>
          </div>
        ) : null}
      </div>

      {snapshot ? (
        <div className="grid gap-5 rounded-xl border border-border bg-white p-4">
          <SnapshotField label={t("jobDescription")}>
            {snapshot.jobDescription ? (
              <JobDescriptionBlock text={snapshot.jobDescription} />
            ) : (
              <p className="text-sm">—</p>
            )}
          </SnapshotField>

          <SnapshotField label={t("referralCode")}>
            {snapshot.referralCode ? (
              <CopyableCode code={snapshot.referralCode} />
            ) : (
              <p className="text-sm">—</p>
            )}
          </SnapshotField>

          <SnapshotField label={t("resume")}>
            {snapshot.resumeFileName ? (
              <div className="grid gap-2">
                <p className="break-all text-sm">{snapshot.resumeFileName}</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void handleResume("view")}
                  >
                    {t("view")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void handleResume("download")}
                  >
                    {t("download")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => replaceRef.current?.click()}
                  >
                    {t("replaceResume")}
                  </Button>
                  <input
                    ref={replaceRef}
                    type="file"
                    accept={resumeAccept()}
                    className="sr-only"
                    aria-label={t("replaceResume")}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      if (file) void replaceResume(file);
                    }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm">—</p>
            )}
          </SnapshotField>
        </div>
      ) : (
        <div className="grid gap-3 rounded-xl border border-dashed border-border p-4">
          <p className="text-sm font-medium">{t("noSnapshotSaved")}</p>
          <p className="whitespace-pre-line text-sm text-muted-foreground">
            {t("noSnapshotSavedHint")}
          </p>
          <div>
            <Button type="button" onClick={() => setFormOpen(true)}>
              {t("saveSnapshot")}
            </Button>
          </div>
        </div>
      )}

      <SnapshotSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        application={application}
        snapshot={snapshot ?? null}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("deleteSnapshotTitle")}
        description={t("deleteSnapshotDescription")}
        confirmLabel={t("deleteSnapshot")}
        onConfirm={async () => {
          try {
            await deleteApplicationSnapshot(application.id);
            toast.success(t("snapshotDeleted"));
          } catch {
            toast.error(t("failedToDeleteSnapshot"));
            throw new Error("delete-failed");
          }
        }}
      />
    </section>
  );
}

function SnapshotSheet({
  open,
  onOpenChange,
  application,
  snapshot,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: Application;
  snapshot: ApplicationSnapshot | null;
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
          <SheetTitle>
            {snapshot ? t("editSnapshot") : t("saveSnapshot")}
          </SheetTitle>
          <SheetDescription>
            {snapshot ? t("editSnapshotDescription") : t("saveSnapshotDescription")}
          </SheetDescription>
        </SheetHeader>
        <div className="p-4">
          {open ? (
            <SnapshotForm
              application={application}
              snapshot={snapshot}
              onCancel={() => onOpenChange(false)}
              onSaved={() => onOpenChange(false)}
            />
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SnapshotForm({
  application,
  snapshot,
  onCancel,
  onSaved,
}: {
  application: Application;
  snapshot: ApplicationSnapshot | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const { saveApplicationSnapshot } = useTracker();
  const fileRef = useRef<HTMLInputElement>(null);
  const [jobDescription, setJobDescription] = useState(
    snapshot?.jobDescription ?? ""
  );
  const [referralCode, setReferralCode] = useState(
    snapshot ? snapshot.referralCode ?? "" : application.referralCode ?? ""
  );
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const displayedName = resumeFile?.name ?? snapshot?.resumeFileName ?? null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (resumeFile) {
      const fileError = resumeFileError(resumeFile);
      if (fileError) {
        setError(
          fileError === "size"
            ? t("resumeFileTooLarge")
            : t("resumeFileTypeInvalid")
        );
        return;
      }
    }
    setError(null);
    setPending(true);
    try {
      await saveApplicationSnapshot(application.id, {
        jobDescription,
        referralCode,
        resumeFile,
        keepExistingResume: Boolean(snapshot?.resumeStoragePath) && !resumeFile,
      });
      toast.success(snapshot ? t("snapshotUpdated") : t("snapshotSaved"));
      onSaved();
    } catch {
      setError(t("failedToSaveSnapshot"));
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
        <Label htmlFor="snapshot-jd">{t("jobDescription")}</Label>
        <Textarea
          id="snapshot-jd"
          value={jobDescription}
          onChange={(event) => setJobDescription(event.target.value)}
          className="min-h-48"
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="snapshot-referral">{t("referralCode")}</Label>
        <Input
          id="snapshot-referral"
          value={referralCode}
          onChange={(event) => setReferralCode(event.target.value)}
        />
      </div>

      <div className="grid gap-1.5">
        <Label>{t("resume")}</Label>
        {displayedName ? (
          <p className="break-all text-sm">{displayedName}</p>
        ) : null}
        <div>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileRef.current?.click()}
          >
            {displayedName ? t("changeFile") : t("uploadResume")}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept={resumeAccept()}
            className="sr-only"
            aria-label={displayedName ? t("changeFile") : t("uploadResume")}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              const fileError = resumeFileError(file);
              if (fileError) {
                setError(
                  fileError === "size"
                    ? t("resumeFileTooLarge")
                    : t("resumeFileTypeInvalid")
                );
                return;
              }
              setError(null);
              setResumeFile(file);
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground">{t("resumeRecommendedPdf")}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? t("saving") : snapshot ? t("saveChanges") : t("saveSnapshot")}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}

function JobDescriptionBlock({ text }: { text: string }) {
  const { t } = useI18n();
  const lines = text.split("\n");
  const needsCollapse =
    lines.length > JD_COLLAPSE_LINES || text.length > JD_COLLAPSE_CHARS;
  const [expanded, setExpanded] = useState(false);
  const display =
    !needsCollapse || expanded
      ? text
      : lines.slice(0, JD_COLLAPSE_LINES).join("\n").slice(0, JD_COLLAPSE_CHARS);

  return (
    <div className="grid gap-2">
      <p className="whitespace-pre-wrap text-sm text-zinc-700">{display}</p>
      {needsCollapse ? (
        <div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-auto px-0 text-muted-foreground"
            onClick={() => setExpanded((current) => !current)}
          >
            {expanded ? t("showLess") : t("showMore")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function CopyableCode({ code }: { code: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  return (
    <span className="inline-flex max-w-full items-center gap-2">
      <span className="min-w-0 break-all text-sm">{code}</span>
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

function SnapshotField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <h3 className="text-xs font-medium text-muted-foreground">{label}</h3>
      <div className="border-t border-dashed border-border pt-2">{children}</div>
    </div>
  );
}
