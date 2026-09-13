"use client";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/use-i18n";
import type { MessageKey } from "@/locales/en";

export function CloudMessage({
  titleKey,
  descriptionKey,
  onRetry,
}: {
  titleKey: MessageKey;
  descriptionKey: MessageKey;
  onRetry?: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="mx-auto grid max-w-md gap-3 py-16 text-center">
      <h1 className="text-xl font-semibold tracking-tight">{t(titleKey)}</h1>
      <p className="text-sm text-muted-foreground">{t(descriptionKey)}</p>
      {onRetry ? (
        <div>
          <Button type="button" variant="outline" onClick={onRetry}>
            {t("retry")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
