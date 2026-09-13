"use client";

import { CloudMessage } from "@/components/auth/cloud-message";
import { Sidebar, SidebarTriggerButton } from "@/components/layout/sidebar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";
import { isLoginPath } from "@/lib/auth/paths";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const { ready, requiresAuth, configError, user } = useAuth();
  const [open, setOpen] = useState(false);

  if (configError) {
    return (
      <CloudMessage
        titleKey="supabaseRequired"
        descriptionKey="supabaseRequiredDescription"
      />
    );
  }

  if (isLoginPath(pathname)) {
    return <>{children}</>;
  }

  if (!ready) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      </div>
    );
  }

  if (requiresAuth && !user) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-full bg-white">
      <aside className="sticky top-0 hidden h-svh w-64 shrink-0 border-r border-border md:block">
        <Sidebar />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3 md:hidden">
          <SidebarTriggerButton onClick={() => setOpen(true)} />
          <span className="text-sm font-semibold">{t("appName")}</span>
        </div>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          className="w-72 p-0"
          showCloseButton
          closeLabel={t("close")}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>{t("navigation")}</SheetTitle>
          </SheetHeader>
          <Sidebar onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
