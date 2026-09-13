"use client";

import { ApplicationSheet } from "@/components/applications/application-sheet";
import { ApplicationTable } from "@/components/applications/application-table";
import { FilterBar } from "@/components/applications/filter-bar";
import { SearchBar } from "@/components/applications/search-bar";
import { StatsBar } from "@/components/applications/stats-bar";
import { CloudMessage } from "@/components/auth/cloud-message";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/use-i18n";
import { useIsClient } from "@/hooks/use-is-client";
import { useTracker } from "@/hooks/use-tracker";
import { emptyApplicationInput } from "@/lib/application-input";
import { applicationFunctionLabel, categoryLabel } from "@/lib/classifications";
import {
  applyListFilters,
  buildListHref,
  getApplicationStats,
  hasListFilters,
  parseGroupByCompany,
  parseListQuery,
  sortApplications,
} from "@/lib/filters";
import { PlusIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export function ApplicationsPage() {
  const { t, option } = useI18n();
  const mounted = useIsClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { applications, categories, tags, ready, loadError, refresh, createApplication } = useTracker();
  const [sheetOpen, setSheetOpen] = useState(false);
  const filters = parseListQuery(searchParams);
  const groupByCompany = parseGroupByCompany(searchParams);
  const [search, setSearch] = useState(filters.search);
  const [searchFromUrl, setSearchFromUrl] = useState(filters.search);
  if (filters.search !== searchFromUrl) {
    setSearchFromUrl(filters.search);
    setSearch(filters.search);
  }

  useEffect(() => {
    if (!ready) return;
    const regionMissing =
      Boolean(filters.regionId) &&
      !categories.some(
        (category) =>
          category.id === filters.regionId && category.type === "region"
      );
    const functionMissing =
      Boolean(filters.functionId) &&
      !categories.some(
        (category) =>
          category.id === filters.functionId && category.type === "function"
      );
    const nextTagIds = filters.tagIds.filter((id) =>
      tags.some((tag) => tag.id === id)
    );
    const tagsMissing = nextTagIds.length !== filters.tagIds.length;
    if (!regionMissing && !functionMissing && !tagsMissing) return;
    router.replace(
      buildListHref(
        {
          ...filters,
          regionId: regionMissing ? null : filters.regionId,
          functionId: functionMissing ? null : filters.functionId,
          tagIds: nextTagIds,
        },
        { groupByCompany }
      )
    );
  }, [categories, filters, groupByCompany, ready, router, tags]);

  const visible = useMemo(
    () =>
      sortApplications(
        applyListFilters(applications, { ...filters, search }, {
          functionLabel: (application) =>
            applicationFunctionLabel(application, categories, option),
          tagNames: (application) =>
            application.tagIds
              .map((id) => tags.find((tag) => tag.id === id)?.name)
              .filter((name): name is string => Boolean(name)),
        })
      ),
    [applications, categories, filters, option, search, tags]
  );
  const stats = useMemo(
    () => getApplicationStats(applications),
    [applications]
  );

  const regionName = categories.find(
    (category) => category.id === filters.regionId
  )?.name;
  const functionCategory = categories.find(
    (category) => category.id === filters.functionId
  );
  const functionName = functionCategory
    ? categoryLabel(functionCategory, option)
    : undefined;

  const title = filters.archived
    ? t("archived")
    : regionName
      ? regionName
      : functionName
        ? functionName
        : filters.status === "active"
          ? t("active")
          : filters.status === "ended"
            ? t("ended")
            : t("applications");

  const empty = emptyStateMessage(filters, search, t, applications.length);

  if (loadError && mounted) {
    return (
      <CloudMessage
        titleKey="cloudUnavailable"
        descriptionKey="cloudUnavailableDescription"
        onRetry={() => void refresh()}
      />
    );
  }

  if (!ready || !mounted) {
    return (
      <div className="mx-auto grid max-w-6xl gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-semibold tracking-tight">{t("applications")}</h1>
        </div>
        <p className="text-sm text-muted-foreground">{t("loadingApplications")}</p>
      </div>
    );
  }

  const showClear = Boolean(search) || hasListFilters({ ...filters, search });

  return (
    <div className="mx-auto grid max-w-6xl gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {showClear ? (
          <Button
            variant="outline"
            onClick={() => {
              setSearch("");
              router.push(buildListHref({}, { groupByCompany }));
            }}
          >
            {t("clearFilters")}
          </Button>
        ) : null}
      </div>

      {!filters.archived ? <StatsBar {...stats} /> : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar value={search} onChange={setSearch} />
        <Button
          className="shrink-0"
          variant={groupByCompany ? "default" : "outline"}
          onClick={() =>
            router.push(
              buildListHref(
                { ...filters, search },
                { groupByCompany: !groupByCompany }
              )
            )
          }
        >
          {t("groupByCompany")}
        </Button>
        <Button className="shrink-0" onClick={() => setSheetOpen(true)}>
          <PlusIcon />
          {t("addApplication")}
        </Button>
      </div>

      <FilterBar
        filters={filters}
        search={search}
        groupByCompany={groupByCompany}
      />

      <ApplicationTable
        applications={visible}
        emptyTitle={empty.title}
        emptyDescription={empty.description}
        groupByCompany={groupByCompany}
      />

      <ApplicationSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={t("addApplication")}
        description={t("addApplicationDescription")}
        initialValue={emptyApplicationInput()}
        submitLabel={t("createApplication")}
        onSubmit={async (value) => {
          try {
            const id = await createApplication(value);
            setSheetOpen(false);
            toast.success(t("applicationAdded"));
            router.push(`/applications/${id}`);
          } catch {
            toast.error(t("failedToSaveApplication"));
          }
        }}
      />
    </div>
  );
}

function emptyStateMessage(
  filters: ReturnType<typeof parseListQuery>,
  search: string,
  t: (key:
    | "emptyArchived"
    | "emptySearch"
    | "noApplicationsInCategory"
    | "noApplicationsMatchFilters"
    | "noApplications"
    | "noApplicationsYet"
    | "noActiveApplications"
    | "noEndedApplications"
    | "noArchivedApplications") => string,
  totalCount: number
) {
  if (filters.archived && !search && !filters.regionId && !filters.functionId && !filters.stage && !filters.status && filters.tagIds.length === 0) {
    return { title: t("noArchivedApplications"), description: t("emptyArchived") };
  }
  if (
    filters.status === "active" &&
    !search &&
    !filters.regionId &&
    !filters.functionId &&
    !filters.stage &&
    filters.tagIds.length === 0
  ) {
    return { title: t("noActiveApplications"), description: t("emptySearch") };
  }
  if (
    filters.status === "ended" &&
    !search &&
    !filters.regionId &&
    !filters.functionId &&
    !filters.stage &&
    filters.tagIds.length === 0
  ) {
    return { title: t("noEndedApplications"), description: t("emptySearch") };
  }
  const onlyCategory =
    !search &&
    !filters.stage &&
    !filters.status &&
    filters.tagIds.length === 0 &&
    Boolean(filters.regionId) !== Boolean(filters.functionId) &&
    (Boolean(filters.regionId) || Boolean(filters.functionId));
  if (onlyCategory) {
    return {
      title: t("noApplications"),
      description: t("noApplicationsInCategory"),
    };
  }
  if (
    search ||
    filters.regionId ||
    filters.functionId ||
    filters.stage ||
    filters.status ||
    filters.tagIds.length > 0
  ) {
    return {
      title: t("noApplications"),
      description: t("noApplicationsMatchFilters"),
    };
  }
  if (totalCount === 0) {
    return { title: t("noApplicationsYet"), description: t("emptySearch") };
  }
  return { title: t("noApplications"), description: t("emptySearch") };
}
