"use client";

import {
  ApplicationCard,
  ApplicationRow,
} from "@/components/applications/application-row";
import { useI18n } from "@/hooks/use-i18n";
import { groupApplicationsByCompany } from "@/lib/companies";
import type { Application } from "@/types";
import { Fragment } from "react";

export function ApplicationTable({
  applications,
  emptyTitle,
  emptyDescription,
  groupByCompany = false,
}: {
  applications: Application[];
  emptyTitle?: string;
  emptyDescription?: string;
  groupByCompany?: boolean;
}) {
  const { t } = useI18n();

  if (applications.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center">
        <p className="text-sm font-medium text-foreground">
          {emptyTitle ?? t("noApplications")}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {emptyDescription ?? t("emptySearch")}
        </p>
      </div>
    );
  }

  const groups = groupByCompany
    ? groupApplicationsByCompany(applications)
    : null;

  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-border bg-zinc-50/80 text-xs font-medium tracking-wide text-muted-foreground">
            <tr>
              {groupByCompany ? null : (
                <th className="px-4 py-2.5 font-medium whitespace-nowrap">
                  {t("company")}
                </th>
              )}
              <th className="px-4 py-2.5 font-medium whitespace-nowrap">
                {t("position")}
              </th>
              <th className="px-4 py-2.5 font-medium whitespace-nowrap">
                {t("region")}
              </th>
              <th className="px-4 py-2.5 font-medium whitespace-nowrap">
                {t("function")}
              </th>
              <th className="px-4 py-2.5 font-medium whitespace-nowrap">
                {t("applied")}
              </th>
              <th className="px-4 py-2.5 font-medium whitespace-nowrap">
                {t("stage")}
              </th>
              <th className="px-4 py-2.5 font-medium whitespace-nowrap">
                {t("status")}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {groups
              ? groups.map((group) => (
                  <Fragment key={group.key}>
                    <tr className="border-b border-border bg-zinc-50/80">
                      <td
                        colSpan={6}
                        className="px-4 py-2 text-sm font-medium text-foreground"
                      >
                        {group.name}
                        <span className="ml-2 text-xs font-normal tabular-nums text-muted-foreground">
                          {t("applicationCount", {
                            count: group.applications.length,
                          })}
                        </span>
                      </td>
                    </tr>
                    {group.applications.map((application) => (
                      <ApplicationRow
                        key={application.id}
                        application={application}
                        hideCompany
                      />
                    ))}
                  </Fragment>
                ))
              : applications.map((application) => (
                  <ApplicationRow
                    key={application.id}
                    application={application}
                  />
                ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 md:hidden">
        {groups
          ? groups.map((group) => (
              <section key={group.key} className="grid gap-3">
                <h2 className="px-1 text-sm font-medium text-foreground">
                  {group.name}
                  <span className="ml-2 text-xs font-normal tabular-nums text-muted-foreground">
                    {t("applicationCount", {
                      count: group.applications.length,
                    })}
                  </span>
                </h2>
                {group.applications.map((application) => (
                  <ApplicationCard
                    key={application.id}
                    application={application}
                    hideCompany
                  />
                ))}
              </section>
            ))
          : applications.map((application) => (
              <ApplicationCard
                key={application.id}
                application={application}
              />
            ))}
      </div>
    </>
  );
}
