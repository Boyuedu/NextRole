import type { Locale } from "@/locales";

export const LOCALE_COOKIE = "locale";
export const LOCALE_STORAGE_KEY = "job-tracker:locale";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function parseLocale(value: string | null | undefined): Locale {
  return value === "zh" ? "zh" : "en";
}

export function htmlLangFor(locale: Locale) {
  return locale === "zh" ? "zh-CN" : "en";
}

export function readLocaleCookie(): Locale | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`)
  );
  if (!match) return null;
  const value = decodeURIComponent(match[1]);
  if (value === "zh" || value === "en") return value;
  return null;
}

export function persistLocale(next: Locale) {
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";
  document.cookie = `${LOCALE_COOKIE}=${next}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
  } catch {
    // Ignore private-mode storage failures.
  }
  document.documentElement.lang = htmlLangFor(next);
}
