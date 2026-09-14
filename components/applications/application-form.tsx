"use client";

import { LabeledSelect } from "@/components/applications/category-selector";
import { StageSelect } from "@/components/applications/stage-select";
import { TagInput } from "@/components/applications/tag-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/hooks/use-i18n";
import { useTracker } from "@/hooks/use-tracker";
import { labeledCategoryOptions, findCategoryByTypedName } from "@/lib/classifications";
import { findCompanyByName, sortCompanies } from "@/lib/companies";
import { JOB_TYPES, getStatusForStage } from "@/lib/constants";
import type { ApplicationInput, ApplicationSection, CategoryType } from "@/types";
import type { MessageKey } from "@/locales/en";
import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";

export function ApplicationForm({
  initialValue,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initialValue: ApplicationInput;
  submitLabel: string;
  onSubmit: (value: ApplicationInput) => Promise<void>;
  onCancel: () => void;
}) {
  const { t, option } = useI18n();
  const { categories, tags, companies, createCategory, createCompany } = useTracker();
  const regions = labeledCategoryOptions(categories, "region", option);
  const functions = labeledCategoryOptions(categories, "function", option);
  const companyOptions = sortCompanies(companies).map((company) => ({
    id: company.id,
    name: company.name,
  }));
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const selectedCompanyId =
    (value.companyId &&
    companies.some((company) => company.id === value.companyId)
      ? value.companyId
      : findCompanyByName(companies, value.company)?.id) ?? "";
  const selectedRegionId =
    value.regionId && regions.some((region) => region.id === value.regionId)
      ? value.regionId
      : "";
  const selectedFunctionId =
    value.functionId && functions.some((item) => item.id === value.functionId)
      ? value.functionId
      : "";
  const selectedTagIds = value.tagIds.filter((id) =>
    tags.some((tag) => tag.id === id)
  );

  function update<K extends keyof ApplicationInput>(
    key: K,
    next: ApplicationInput[K]
  ) {
    setValue((current) => ({ ...current, [key]: next }));
  }

  async function createClassification(type: CategoryType, name: string) {
    const existing = findCategoryByTypedName(categories, type, name, option);
    if (existing) return existing.id;
    return createCategory(type, name);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!value.company.trim() && !selectedCompanyId) {
      setError(t("companyPositionRequired"));
      return;
    }
    if (!value.position.trim()) {
      setError(t("companyPositionRequired"));
      return;
    }
    setError(null);
    setPending(true);
    try {
      let companyId = selectedCompanyId;
      let companyName =
        companies.find((company) => company.id === companyId)?.name ??
        value.company.trim();
      if (!companyId && companyName) {
        companyId = await createCompany(companyName);
        companyName =
          companies.find((company) => company.id === companyId)?.name ??
          companyName;
      }
      if (!companyId || !companyName) {
        setError(t("companyPositionRequired"));
        setPending(false);
        return;
      }
      await onSubmit({
        ...value,
        regionId: selectedRegionId,
        functionId: selectedFunctionId,
        tagIds: selectedTagIds,
        companyId,
        company: companyName,
        position: value.position.trim(),
        stage: value.stage.trim() || "Saved",
      });
    } catch {
      setError(t("couldNotSave"));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      {error ? (
        <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label>{`${t("company")} *`}</Label>
          <LabeledSelect
            value={selectedCompanyId || null}
            onChange={(companyId) => {
              const company = companies.find((item) => item.id === companyId);
              setValue((current) => ({
                ...current,
                companyId: companyId ?? "",
                company: company?.name ?? current.company,
              }));
            }}
            options={companyOptions}
            placeholder={value.company || t("selectCompany")}
            emptyLabel={value.company || t("selectCompany")}
            allowEmpty={false}
            createLabel={t("addCompany")}
            onCreate={async (name) => {
              const id = await createCompany(name);
              setValue((current) => ({
                ...current,
                companyId: id,
                company: name.trim(),
              }));
              return id;
            }}
          />
          {companyOptions.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t("noCompaniesYet")}</p>
          ) : null}
          <ManageLink href="/settings#companies" labelKey="manageCompanies" />
        </div>
        <Field label={`${t("position")} *`} htmlFor="position">
          <Input
            id="position"
            value={value.position}
            onChange={(event) => update("position", event.target.value)}
            required
          />
        </Field>
        <Field label={t("location")} htmlFor="location">
          <Input
            id="location"
            value={value.location}
            onChange={(event) => update("location", event.target.value)}
          />
        </Field>
        <div className="grid gap-1.5">
          <Label>{t("region")}</Label>
          <LabeledSelect
            value={selectedRegionId || null}
            onChange={(regionId) => update("regionId", regionId ?? "")}
            options={regions}
            emptyLabel={t("unassigned")}
            createLabel={t("addNewRegion")}
            onCreate={(name) => createClassification("region", name)}
          />
          {regions.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t("noRegionsYet")}</p>
          ) : null}
          <ManageLink href="/settings#regions" labelKey="manageRegions" />
        </div>
        <div className="grid gap-1.5">
          <Label>{t("function")}</Label>
          <LabeledSelect
            value={selectedFunctionId || null}
            onChange={(functionId) => update("functionId", functionId ?? "")}
            options={functions}
            emptyLabel={t("unassigned")}
            createLabel={t("addCustomFunction")}
            onCreate={(name) => createClassification("function", name)}
          />
          {functions.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t("noFunctionsYet")}</p>
          ) : null}
          <ManageLink href="/settings#functions" labelKey="manageFunctions" />
        </div>
        <div className="grid gap-1.5">
          <Label>{t("status")}</Label>
          <LabeledSelect
            value={value.status}
            onChange={(status) =>
              update("status", (status as ApplicationSection) ?? "active")
            }
            options={[
              { id: "active", name: t("active") },
              { id: "ended", name: t("ended") },
            ]}
            allowEmpty={false}
          />
        </div>
        <div className="grid gap-1.5">
          <Label>{t("stage")}</Label>
          <StageSelect
            stage={value.stage}
            className="w-full"
            size="default"
            triggerClassName="max-w-none"
            disabled={pending}
            onChange={(stage) => {
              setValue((current) => ({
                ...current,
                stage,
                status: getStatusForStage(stage),
              }));
            }}
          />
        </div>
        <div className="grid gap-1.5">
          <Label>{t("jobType")}</Label>
          <LabeledSelect
            value={value.jobType || null}
            onChange={(jobType) => update("jobType", jobType ?? "")}
            options={JOB_TYPES.map((name) => ({
              id: name,
              name: option("jobTypes", name),
            }))}
            emptyLabel={t("none")}
          />
        </div>
        <Field label={t("appliedDate")} htmlFor="appliedDate">
          <Input
            id="appliedDate"
            type="date"
            value={value.appliedDate}
            onChange={(event) => update("appliedDate", event.target.value)}
          />
        </Field>
        <Field label={t("jobUrl")} htmlFor="jobUrl">
          <Input
            id="jobUrl"
            type="url"
            value={value.jobUrl}
            onChange={(event) => update("jobUrl", event.target.value)}
          />
        </Field>
        <Field label={t("jobId")} htmlFor="jobId">
          <Input
            id="jobId"
            value={value.jobId}
            onChange={(event) => update("jobId", event.target.value)}
          />
        </Field>
        <Field label={t("resumeUsed")} htmlFor="resumeUsed">
          <Input
            id="resumeUsed"
            value={value.resumeUsed}
            onChange={(event) => update("resumeUsed", event.target.value)}
          />
        </Field>
        <Field label={t("source")} htmlFor="source">
          <Input
            id="source"
            value={value.source}
            onChange={(event) => update("source", event.target.value)}
          />
        </Field>
        <Field label={t("referralCode")} htmlFor="referralCode">
          <Input
            id="referralCode"
            value={value.referralCode}
            onChange={(event) => update("referralCode", event.target.value)}
            placeholder={t("optional")}
            autoComplete="off"
            spellCheck={false}
          />
        </Field>
      </div>

      <div className="grid gap-1.5">
        <Label>{t("tags")}</Label>
        <TagInput
          value={selectedTagIds}
          onChange={(tagIds) => update("tagIds", tagIds)}
        />
        <ManageLink href="/settings#tags" labelKey="manageTags" />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="notes">{t("notes")}</Label>
        <Textarea
          id="notes"
          value={value.notes}
          onChange={(event) => update("notes", event.target.value)}
          rows={5}
        />
      </div>

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

function ManageLink({
  href,
  labelKey,
}: {
  href: string;
  labelKey: Extract<
    MessageKey,
    "manageRegions" | "manageFunctions" | "manageTags" | "manageCompanies"
  >;
}) {
  const { t } = useI18n();
  return (
    <Button
      type="button"
      variant="link"
      size="sm"
      className="h-auto justify-start px-0 text-xs"
      nativeButton={false}
      render={<Link href={href} />}
    >
      {t(labelKey)}
    </Button>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
