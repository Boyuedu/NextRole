"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AccountArea() {
  const { t } = useI18n();
  const { user, requiresAuth, status, signOut } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  if (!requiresAuth || status !== "authenticated" || !user) return null;

  async function onSignOut() {
    setBusy(true);
    try {
      await signOut();
      router.replace("/login");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-2">
      <p className="truncate px-0.5 text-xs text-muted-foreground" title={user.email ?? undefined}>
        {user.email}
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full justify-center"
        disabled={busy}
        onClick={() => void onSignOut()}
      >
        {busy ? t("signingOut") : t("signOut")}
      </Button>
    </div>
  );
}
