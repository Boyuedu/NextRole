"use client";

import { Input } from "@/components/ui/input";
import { useI18n } from "@/hooks/use-i18n";
import { SearchIcon } from "lucide-react";

export function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="relative min-w-0 flex-1">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t("searchPlaceholder")}
        className="pl-8"
        aria-label={t("searchApplications")}
      />
    </div>
  );
}
