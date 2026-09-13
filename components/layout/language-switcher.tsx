"use client";

import { useI18n } from "@/hooks/use-i18n";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const { t, locale, setLocale } = useI18n();

  return (
    <div
      className="flex items-center gap-1 text-xs"
      role="group"
      aria-label={t("language")}
    >
      <button
        type="button"
        onClick={() => setLocale("en")}
        aria-pressed={locale === "en"}
        className={cn(
          "rounded-md px-1.5 py-1 text-zinc-500 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
          locale === "en" && "bg-white text-foreground ring-1 ring-border"
        )}
      >
        EN
      </button>
      <span className="text-zinc-300" aria-hidden="true">
        /
      </span>
      <button
        type="button"
        onClick={() => setLocale("zh")}
        aria-pressed={locale === "zh"}
        className={cn(
          "rounded-md px-1.5 py-1 text-zinc-500 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
          locale === "zh" && "bg-white text-foreground ring-1 ring-border"
        )}
      >
        中文
      </button>
    </div>
  );
}
