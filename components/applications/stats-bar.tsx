"use client";

import { useI18n } from "@/hooks/use-i18n";

export function StatsBar({
  total,
  applied,
  interviewing,
  offers,
}: {
  total: number;
  applied: number;
  interviewing: number;
  offers: number;
}) {
  const { t, locale } = useI18n();
  const items = [
    { key: "total", label: t("total"), value: total },
    { key: "applied", label: t("statsApplied"), value: applied },
    { key: "interviewing", label: t("interviewing"), value: interviewing },
    { key: "offers", label: t("offers"), value: offers },
  ];

  return (
    <div className="flex flex-wrap gap-3">
      {items.map((item) => (
        <div
          key={item.key}
          className="min-w-[7.5rem] flex-1 rounded-xl border border-border bg-white px-4 py-3"
        >
          <div
            className={`text-xs font-medium tracking-wide text-muted-foreground ${
              locale === "en" ? "uppercase" : ""
            }`}
          >
            {item.label}
          </div>
          <div className="mt-1 text-2xl font-semibold tracking-tight">
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}
