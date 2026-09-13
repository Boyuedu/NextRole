"use client";

import { BackupSection } from "@/components/settings/backup-section";
import { CloudMessage } from "@/components/auth/cloud-message";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/hooks/use-i18n";
import { useIsClient } from "@/hooks/use-is-client";
import { useTracker } from "@/hooks/use-tracker";
import {
  categoryLabel,
  isSystemFunction,
  sortCategories,
} from "@/lib/classifications";
import { sortCompanies } from "@/lib/companies";
import type { MessageKey } from "@/locales/en";
import { PlusIcon } from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import { toast } from "sonner";

export function SettingsPage() {
  const { t } = useI18n();
  const mounted = useIsClient();
  const {
    ready,
    loadError,
    refresh,
    applications,
    categories,
    tags,
    companies,
    createCategory,
    renameCategory,
    deleteCategory,
    createTag,
    renameTag,
    deleteTag,
    createCompany,
    renameCompany,
    deleteCompany,
  } = useTracker();

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

  const regions = sortCategories(
    categories.filter((category) => category.type === "region")
  );

  return (
    <div className="mx-auto grid max-w-3xl gap-10">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          {t("classificationSettings")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("classificationSettingsDescription")}
        </p>
      </div>
      <ClassificationSection
        id="regions"
        title={t("regions")}
        addLabel={t("addRegion")}
        emptyLabel={t("noRegionsYet")}
        items={regions}
        usageOf={(id) =>
          applications.filter((application) => application.regionId === id).length
        }
        inUseKey="regionInUse"
        onCreate={async (name) => {
          await createCategory("region", name);
        }}
        onRename={renameCategory}
        onDelete={deleteCategory}
        addedToast={t("categoryAdded")}
        renamedToast={t("categoryRenamed")}
        deletedToast={t("categoryDeleted")}
      />
      <FunctionsSection />
      <ClassificationSection
        id="companies"
        title={t("companies")}
        addLabel={t("addCompany")}
        emptyLabel={t("noCompaniesYet")}
        items={sortCompanies(companies)}
        usageOf={(id) =>
          applications.filter((application) => application.companyId === id)
            .length
        }
        inUseKey="companyInUse"
        onCreate={async (name) => {
          await createCompany(name);
        }}
        onRename={renameCompany}
        onDelete={deleteCompany}
        addedToast={t("companyAdded")}
        renamedToast={t("companyRenamed")}
        deletedToast={t("companyDeleted")}
      />
      <ClassificationSection
        id="tags"
        title={t("tags")}
        addLabel={t("addTag")}
        emptyLabel={t("noTagsYet")}
        items={tags}
        usageOf={(id) =>
          applications.filter((application) => application.tagIds.includes(id))
            .length
        }
        inUseKey="tagInUse"
        onCreate={async (name) => {
          await createTag(name);
        }}
        onRename={renameTag}
        onDelete={deleteTag}
        addedToast={t("tagAdded")}
        renamedToast={t("tagRenamed")}
        deletedToast={t("tagDeleted")}
      />
      <BackupSection />
    </div>
  );
}

function FunctionsSection() {
  const { t, option } = useI18n();
  const {
    applications,
    categories,
    createCategory,
    renameCategory,
    deleteCategory,
  } = useTracker();
  const functions = sortCategories(
    categories.filter((category) => category.type === "function")
  );

  return (
    <ClassificationSection
      id="functions"
      title={t("functions")}
      addLabel={t("addCustomFunction")}
      emptyLabel={t("noFunctionsYet")}
      items={functions.map((item) => ({
        id: item.id,
        name: categoryLabel(item, option),
        allowRename: !isSystemFunction(item),
      }))}
      usageOf={(id) =>
        applications.filter((application) => application.functionId === id)
          .length
      }
      inUseKey="functionInUse"
      onCreate={async (name) => {
        await createCategory("function", name);
      }}
      onRename={renameCategory}
      onDelete={deleteCategory}
      addedToast={t("categoryAdded")}
      renamedToast={t("categoryRenamed")}
      deletedToast={t("categoryDeleted")}
    />
  );
}

function ClassificationSection({
  id,
  title,
  addLabel,
  emptyLabel,
  items,
  usageOf,
  inUseKey,
  onCreate,
  onRename,
  onDelete,
  addedToast,
  renamedToast,
  deletedToast,
}: {
  id?: string;
  title: string;
  addLabel: string;
  emptyLabel: string;
  items: { id: string; name: string; allowRename?: boolean }[];
  usageOf: (id: string) => number;
  inUseKey: "regionInUse" | "functionInUse" | "tagInUse" | "companyInUse";
  onCreate: (name: string) => Promise<void>;
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  addedToast: string;
  renamedToast: string;
  deletedToast: string;
}) {
  const { t } = useI18n();
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleCreate() {
    const trimmed = draft.trim();
    const duplicate = items.some(
      (item) => item.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) {
      toast.error(t("duplicateName"));
      return;
    }
    setBusy(true);
    const ok = await runNamedAction(() => onCreate(draft), t);
    setBusy(false);
    if (!ok) return;
    setDraft("");
    toast.success(addedToast);
  }

  async function handleRename(id: string) {
    setBusy(true);
    const ok = await runNamedAction(() => onRename(id, editingName), t);
    setBusy(false);
    if (!ok) return;
    setEditingId(null);
    toast.success(renamedToast);
  }

  function handleRenameKey(event: KeyboardEvent<HTMLInputElement>, id: string) {
    if (event.key === "Enter") {
      event.preventDefault();
      void handleRename(id);
    }
    if (event.key === "Escape") {
      setEditingId(null);
    }
  }

  return (
    <section id={id} className="grid gap-3 scroll-mt-6">
      <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
      {items.length === 0 ? (
        emptyLabel ? (
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        ) : null
      ) : (
        <div className="divide-y divide-border rounded-xl border border-border">
          {items.map((item) => {
            const canRename = item.allowRename !== false;
            return (
            <div
              key={item.id}
              className="flex flex-wrap items-center gap-2 px-3 py-2"
            >
              {editingId === item.id ? (
                <Input
                  value={editingName}
                  onChange={(event) => setEditingName(event.target.value)}
                  onKeyDown={(event) => handleRenameKey(event, item.id)}
                  className="h-8 min-w-0 flex-1"
                  autoFocus
                />
              ) : (
                <span className="min-w-0 flex-1 truncate text-sm" title={item.name}>
                  {item.name}
                </span>
              )}
              <span className="text-xs tabular-nums text-muted-foreground">
                {t("usedCount", { count: usageOf(item.id) })}
              </span>
              {editingId === item.id ? (
                <>
                  <Button
                    size="sm"
                    disabled={busy}
                    onClick={() => handleRename(item.id)}
                  >
                    {busy ? t("saving") : t("save")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingId(null)}
                  >
                    {t("cancel")}
                  </Button>
                </>
              ) : (
                <>
                  {canRename ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => {
                        setEditingId(item.id);
                        setEditingName(item.name);
                      }}
                    >
                      {t("rename")}
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => setPendingDelete(item)}
                  >
                    {t("delete")}
                  </Button>
                </>
              )}
            </div>
            );
          })}
        </div>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void handleCreate();
            }
          }}
          placeholder={addLabel}
        />
        <Button
          className="shrink-0"
          disabled={busy || !draft.trim()}
          onClick={() => void handleCreate()}
        >
          <PlusIcon />
          {busy ? t("saving") : addLabel}
        </Button>
      </div>
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title={
          pendingDelete
            ? t("deleteNamedTitle", { name: pendingDelete.name })
            : t("deleteCategoryTitle")
        }
        description={
          pendingDelete && usageOf(pendingDelete.id) > 0
            ? t(inUseKey, { count: usageOf(pendingDelete.id) })
            : t("unusedDeleteWarning")
        }
        confirmLabel={t("delete")}
        onConfirm={async () => {
          if (!pendingDelete) return;
          try {
            await onDelete(pendingDelete.id);
            toast.success(deletedToast);
          } catch (error) {
            console.error(error);
            toast.error(t("couldNotSave"));
            throw error;
          }
        }}
      />
    </section>
  );
}

async function runNamedAction(
  action: () => Promise<unknown>,
  t: (key: MessageKey, vars?: Record<string, string | number>) => string
) {
  try {
    await action();
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    if (message.includes("required")) {
      toast.error(t("nameRequired"));
    } else if (
      message.includes("already exists") ||
      message.includes("duplicate")
    ) {
      toast.error(t("duplicateName"));
    } else if (message.includes("system")) {
      toast.error(t("cannotEditSystem"));
    } else {
      toast.error(t("couldNotSave"));
    }
    return false;
  }
}
