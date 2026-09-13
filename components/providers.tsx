"use client";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { I18nProvider } from "@/hooks/use-i18n";
import { TrackerProvider } from "@/hooks/use-tracker";
import type { Locale } from "@/locales";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

export function AppProviders({
  children,
  initialLocale,
  supabaseConfigured,
}: {
  children: ReactNode;
  initialLocale: Locale;
  supabaseConfigured: boolean;
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light">
      <TooltipProvider>
        <I18nProvider initialLocale={initialLocale}>
          <AuthProvider supabaseConfigured={supabaseConfigured}>
            <TrackerProvider>
              {children}
              <Toaster theme="light" />
            </TrackerProvider>
          </AuthProvider>
        </I18nProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}
