"use client";

import { LabeledSelect } from "@/components/applications/category-selector";
import { StageSelect } from "@/components/applications/stage-select";
import { TagPill } from "@/components/applications/tag-pill";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useI18n } from "@/hooks/use-i18n";
import { useTracker } from "@/hooks/use-tracker";
import { labeledCategoryOptions } from "@/lib/classifications";
import { buildListHref } from "@/lib/filters";
import type { ApplicationListFilters } from "@/types";
import { useRouter } from "next/navigation";

export function FilterBar({
  filters,
  search,
}: {
  filters: ApplicationListFilters;
  search: string;
}) {
  const { t, option } = useI18n();
  const router = useRouter();
  const { categories, tags } = useTracker();
  const regions = labeledCategoryOptions(categories, "region", option);
  const functions = labeledCategoryOptions(categories, "function", option);
  const selectedTags = tags.filter((tag) => filters.tagIds.includes(tag.id));

  function update(next: Partial<ApplicationListFilters>) {
    router.push(
      buildListHref({
        ...filters,
        search,
        ...next,
      })
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <LabeledSelect
          aria-label={t("region")}
          value={filters.regionId}
          onChange={(regionId) => update({ regionId })}
          options={regions}
          emptyLabel={t("allRegions")}
          triggerClassName="h-8"
        />
        <LabeledSelect
          aria-label={t("function")}
          value={filters.functionId}
          onChange={(functionId) => update({ functionId })}
          options={functions}
          emptyLabel={t("allFunctions")}
          triggerClassName="h-8"
        />
        <StageSelect
          stage={filters.stage ?? ""}
          allowEmpty
          emptyLabel={t("stage")}
          onChange={(stage) => update({ stage: stage || null })}
          className="w-full"
          size="default"
          triggerClassName="max-w-none"
        />
        <LabeledSelect
          aria-label={t("status")}
          value={filters.status}
          onChange={(status) =>
            update({ status: status === "active" || status === "ended" ? status : null })
          }
          options={[
            { id: "active", name: t("active") },
            { id: "ended", name: t("ended") },
          ]}
          emptyLabel={t("status")}
          triggerClassName="h-8"
        />
        <Popover>
          <PopoverTrigger
            className="inline-flex h-8 w-full items-center justify-start rounded-lg border border-border bg-background px-2.5 text-sm font-normal"
            aria-label={t("tags")}
          >
            {selectedTags.length > 0
              ? selectedTags.map((tag) => tag.name).join(", ")
              : t("tags")}
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64">
            {tags.length === 0 ? (
              <p className="px-1 py-2 text-sm text-muted-foreground">
                {t("noTagsYet")}
              </p>
            ) : (
              <div className="grid gap-1.5">
                {tags.map((tag) => {
                  const checked = filters.tagIds.includes(tag.id);
                  return (
                    <label
                      key={tag.id}
                      className="flex items-center gap-2 rounded-md px-1 py-1 text-sm hover:bg-zinc-50"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) =>
                          update({
                            tagIds: value
                              ? [...filters.tagIds, tag.id]
                              : filters.tagIds.filter((id) => id !== tag.id),
                          })
                        }
                      />
                      {tag.name}
                    </label>
                  );
                })}
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>
      {selectedTags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {selectedTags.map((tag) => (
            <TagPill
              key={tag.id}
              name={tag.name}
              onRemove={() =>
                update({
                  tagIds: filters.tagIds.filter((id) => id !== tag.id),
                })
              }
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
