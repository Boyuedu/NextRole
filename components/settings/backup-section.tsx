"use client";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useI18n } from "@/hooks/use-i18n";
import { useTracker } from "@/hooks/use-tracker";
import {
  BackupError,
  backupFileName,
  createBackup,
  parseBackup,
  toCsv,
  type ImportMode,
  type TrackerBackup,
} from "@/lib/backup";
import { downloadTextFile } from "@/lib/download";
import { useRef, useState } from "react";
import { toast } from "sonner";

export function BackupSection() {
  const { t, locale } = useI18n();
  const { applications, categories, companies, tags, events, applicationSnapshots, importSnapshot } =
    useTracker();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<"json" | "csv" | "import" | null>(
    null
  );
  const [backup, setBackup] = useState<TrackerBackup | null>(null);
  const [mode, setMode] = useState<ImportMode | null>(null);
  const [replaceOpen, setReplaceOpen] = useState(false);

  function snapshot() {
    return { applications, categories, companies, tags, events, applicationSnapshots };
  }

  async function exportJson() {
    setPending("json");
    try {
      const payload = createBackup(snapshot(), locale);
      downloadTextFile(
        backupFileName("json"),
        JSON.stringify(payload, null, 2),
        "application/json;charset=utf-8"
      );
    } catch (error) {
      console.error(error);
      toast.error(t("exportFailed"));
    } finally {
      setPending(null);
    }
  }

  async function exportCsv() {
    setPending("csv");
    try {
      downloadTextFile(
        backupFileName("csv"),
        toCsv(snapshot()),
        "text/csv;charset=utf-8"
      );
    } catch (error) {
      console.error(error);
      toast.error(t("exportFailed"));
    } finally {
      setPending(null);
    }
  }

  async function handleFile(file: File) {
    try {
      const text = await file.text();
      let raw: unknown;
      try {
        raw = JSON.parse(text);
      } catch {
        throw new BackupError();
      }
      const parsed = parseBackup(raw);
      setBackup(parsed);
      setMode(null);
    } catch (error) {
      if (!(error instanceof BackupError)) {
        console.error(error);
      }
      toast.error(
        error instanceof BackupError ? t("invalidBackup") : t("importFailed")
      );
    }
  }

  async function runImport(selected: ImportMode) {
    if (!backup) return;
    setPending("import");
    try {
      await importSnapshot(backup, selected);
      setBackup(null);
      setMode(null);
      toast.success(t("importSucceeded"));
    } catch (error) {
      console.error(error);
      toast.error(t("importFailed"));
    } finally {
      setPending(null);
      setReplaceOpen(false);
    }
  }

  return (
    <section className="grid gap-3">
      <h2 className="text-sm font-medium text-muted-foreground">{t("backup")}</h2>
      <p className="text-sm text-muted-foreground">{t("backupDescription")}</p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          disabled={Boolean(pending)}
          onClick={() => void exportJson()}
        >
          {pending === "json" ? t("exporting") : t("exportJson")}
        </Button>
        <Button
          variant="outline"
          disabled={Boolean(pending)}
          onClick={() => void exportCsv()}
        >
          {pending === "csv" ? t("exporting") : t("exportCsv")}
        </Button>
        <Button
          disabled={Boolean(pending)}
          onClick={() => fileRef.current?.click()}
        >
          {pending === "import" ? t("importing") : t("importBackup")}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          aria-label={t("importBackup")}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void handleFile(file);
          }}
        />
      </div>

      <Dialog
        open={Boolean(backup) && !replaceOpen}
        onOpenChange={(open) => {
          if (!open) {
            setBackup(null);
            setMode(null);
          }
        }}
      >
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("importConfirmTitle")}</DialogTitle>
            <DialogDescription>{t("importMode")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <label className="flex items-start gap-2 text-sm">
              <input
                type="radio"
                name="import-mode"
                checked={mode === "merge"}
                onChange={() => setMode("merge")}
                className="mt-1"
              />
              <span>
                <span className="font-medium">{t("importMerge")}</span>
                <span className="mt-0.5 block text-muted-foreground">
                  {t("importMergeHint")}
                </span>
              </span>
            </label>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="radio"
                name="import-mode"
                checked={mode === "replace"}
                onChange={() => setMode("replace")}
                className="mt-1"
              />
              <span>
                <span className="font-medium">{t("importReplace")}</span>
                <span className="mt-0.5 block text-muted-foreground">
                  {t("importReplaceHint")}
                </span>
              </span>
            </label>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setBackup(null);
                setMode(null);
              }}
            >
              {t("cancel")}
            </Button>
            <Button
              type="button"
              disabled={pending === "import"}
              onClick={() => {
                if (!mode) {
                  toast.error(t("chooseImportMode"));
                  return;
                }
                if (mode === "replace") {
                  setReplaceOpen(true);
                  return;
                }
                void runImport("merge");
              }}
            >
              {pending === "import" ? t("importing") : t("importBackup")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={replaceOpen}
        onOpenChange={(open) => {
          if (!open) setReplaceOpen(false);
        }}
        title={t("importReplaceTitle")}
        description={t("importReplaceHint")}
        confirmLabel={pending === "import" ? t("importing") : t("importReplace")}
        onConfirm={async () => {
          await runImport("replace");
        }}
      />
    </section>
  );
}
