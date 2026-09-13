import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/layout/app-shell";
import { AppProviders } from "@/components/providers";
import { htmlLangFor, LOCALE_COOKIE, parseLocale } from "@/lib/locale";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { cookies } from "next/headers";
import { Suspense } from "react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NextRole",
  description:
    "A simple, structured way to track job applications, recruitment stages, and the materials used for each application.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = parseLocale(cookieStore.get(LOCALE_COOKIE)?.value);
  const supabaseConfigured = isSupabaseConfigured();

  return (
    <html
      lang={htmlLangFor(locale)}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-white text-foreground">
        <AppProviders initialLocale={locale} supabaseConfigured={supabaseConfigured}>
          <Suspense>
            <AppShell>{children}</AppShell>
          </Suspense>
        </AppProviders>
      </body>
    </html>
  );
}
