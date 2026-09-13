"use client";

import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";
import {
  mergeSnapshots,
  parseBackup,
  type ImportMode,
} from "@/lib/backup";
import type { TrackerBackup } from "@/lib/backup";
import { getRepository, resetRepository } from "@/lib/data";
import type { TrackerRepository, TrackerSnapshot } from "@/lib/data/types";
import type {
  ApplicationEventInput,
  ApplicationInput,
  ApplicationSnapshot,
  ApplicationSnapshotInput,
  CategoryType,
  EventWriteOptions,
} from "@/types";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const emptySnapshot = (): TrackerSnapshot => ({
  applications: [],
  categories: [],
  companies: [],
  tags: [],
  events: [],
  applicationSnapshots: [],
});

interface TrackerContextValue {
  ready: boolean;
  mode: TrackerRepository["mode"];
  loadError: boolean;
  applications: TrackerSnapshot["applications"];
  categories: TrackerSnapshot["categories"];
  companies: TrackerSnapshot["companies"];
  tags: TrackerSnapshot["tags"];
  events: TrackerSnapshot["events"];
  applicationSnapshots: TrackerSnapshot["applicationSnapshots"];
  refresh: () => Promise<void>;
  createApplication: (input: ApplicationInput) => Promise<string>;
  updateApplication: (id: string, input: ApplicationInput) => Promise<void>;
  deleteApplication: (id: string) => Promise<void>;
  setArchived: (id: string, archived: boolean) => Promise<void>;
  setStage: (id: string, stage: string) => Promise<void>;
  importSnapshot: (backup: TrackerBackup, mode: ImportMode) => Promise<void>;
  createCategory: (type: CategoryType, name: string) => Promise<string>;
  renameCategory: (id: string, name: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  createTag: (name: string) => Promise<string>;
  renameTag: (id: string, name: string) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
  createCompany: (name: string) => Promise<string>;
  renameCompany: (id: string, name: string) => Promise<void>;
  deleteCompany: (id: string) => Promise<void>;
  createEvent: (
    applicationId: string,
    input: ApplicationEventInput,
    options?: EventWriteOptions
  ) => Promise<void>;
  updateEvent: (
    id: string,
    input: ApplicationEventInput,
    options?: EventWriteOptions
  ) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  saveApplicationSnapshot: (
    applicationId: string,
    input: ApplicationSnapshotInput
  ) => Promise<void>;
  deleteApplicationSnapshot: (applicationId: string) => Promise<void>;
  getResumeBlob: (snapshot: ApplicationSnapshot) => Promise<Blob>;
}

const TrackerContext = createContext<TrackerContextValue | null>(null);

export function TrackerProvider({ children }: { children: ReactNode }) {
  const { setLocale } = useI18n();
  const auth = useAuth();
  const [snapshot, setSnapshot] = useState<TrackerSnapshot>(emptySnapshot);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [mode, setMode] = useState<TrackerRepository["mode"]>("local");

  const refresh = useCallback(async () => {
    const repository = getRepository();
    setMode(repository.mode);
    setSnapshot(await repository.load());
    setLoadError(false);
  }, []);

  useEffect(() => {
    if (!auth.ready || auth.configError) {
      return;
    }
    if (auth.requiresAuth && !auth.user) {
      resetRepository();
      return;
    }

    let active = true;
    (async () => {
      try {
        await refresh();
      } catch (error) {
        console.error(error);
        if (active) {
          setSnapshot(emptySnapshot());
          setLoadError(true);
        }
      } finally {
        if (active) setReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [auth.configError, auth.ready, auth.requiresAuth, auth.user, refresh]);

  const run = useCallback(
    async function runOperation<T>(
      operation: (repository: TrackerRepository) => Promise<T>
    ) {
      const repository = getRepository();
      try {
        const result = await operation(repository);
        await refresh();
        return result;
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
    [refresh]
  );

  const value = useMemo<TrackerContextValue>(
    () => ({
      ready,
      mode,
      loadError,
      applications: snapshot.applications,
      categories: snapshot.categories,
      companies: snapshot.companies,
      tags: snapshot.tags,
      events: snapshot.events,
      applicationSnapshots: snapshot.applicationSnapshots,
      refresh,
      createApplication: (input) =>
        run((repository) =>
          repository.createApplication(input).then((application) => application.id)
        ),
      updateApplication: (id, input) =>
        run((repository) => repository.updateApplication(id, input)).then(
          () => undefined
        ),
      deleteApplication: (id) =>
        run((repository) => repository.deleteApplication(id)),
      setArchived: (id, archived) =>
        run((repository) => repository.setArchived(id, archived)).then(
          () => undefined
        ),
      setStage: (id, stage) =>
        run((repository) => repository.setStage(id, stage)).then(() => undefined),
      importSnapshot: async (backup, mode) => {
        await run(async (repository) => {
          const current = await repository.load();
          const incoming = parseBackup(backup);
          const next =
            mode === "replace"
              ? incoming
              : mergeSnapshots(current, incoming);
          await repository.replaceSnapshot(next);
        });
        if (mode === "replace" && backup.locale) setLocale(backup.locale);
      },
      createCategory: (type, name) =>
        run((repository) =>
          repository.createCategory(type, name).then((category) => category.id)
        ),
      renameCategory: (id, name) =>
        run((repository) => repository.renameCategory(id, name)).then(
          () => undefined
        ),
      deleteCategory: (id) => run((repository) => repository.deleteCategory(id)),
      createTag: (name) =>
        run((repository) => repository.createTag(name).then((tag) => tag.id)),
      renameTag: (id, name) =>
        run((repository) => repository.renameTag(id, name)).then(() => undefined),
      deleteTag: (id) => run((repository) => repository.deleteTag(id)),
      createCompany: (name) =>
        run((repository) =>
          repository.createCompany(name).then((company) => company.id)
        ),
      renameCompany: (id, name) =>
        run((repository) => repository.renameCompany(id, name)).then(
          () => undefined
        ),
      deleteCompany: (id) => run((repository) => repository.deleteCompany(id)),
      createEvent: (applicationId, input, options) =>
        run((repository) =>
          repository.createEvent(applicationId, input, options)
        ).then(() => undefined),
      updateEvent: (id, input, options) =>
        run((repository) => repository.updateEvent(id, input, options)).then(
          () => undefined
        ),
      deleteEvent: (id) => run((repository) => repository.deleteEvent(id)),
      saveApplicationSnapshot: (applicationId, input) =>
        run((repository) =>
          repository.saveApplicationSnapshot(applicationId, input)
        ).then(() => undefined),
      deleteApplicationSnapshot: (applicationId) =>
        run((repository) => repository.deleteApplicationSnapshot(applicationId)),
      getResumeBlob: (snapshot) =>
        getRepository().getResumeBlob(snapshot),
    }),
    [loadError, mode, ready, refresh, run, setLocale, snapshot]
  );

  return (
    <TrackerContext.Provider value={value}>{children}</TrackerContext.Provider>
  );
}

export function useTracker() {
  const context = useContext(TrackerContext);
  if (!context) {
    throw new Error("useTracker must be used within TrackerProvider");
  }
  return context;
}
