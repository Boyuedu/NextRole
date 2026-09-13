"use client";

import { dictionaries, type Locale, type OptionGroup } from "@/locales";
import type { MessageKey } from "@/locales/en";
import {
  htmlLangFor,
  LOCALE_STORAGE_KEY,
  persistLocale,
  readLocaleCookie,
  parseLocale,
} from "@/lib/locale";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
  option: (group: OptionGroup, value: string | null | undefined) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    document.documentElement.lang = htmlLangFor(locale);
  }, [locale]);

  useEffect(() => {
    let cancelled = false;
    const cookieLocale = readLocaleCookie();
    if (cookieLocale) {
      persistLocale(cookieLocale);
      return () => {
        cancelled = true;
      };
    }

    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    } catch {
      stored = null;
    }

    if (stored === "zh" || stored === "en") {
      persistLocale(stored);
      if (stored !== initialLocale) {
        const next = stored;
        void Promise.resolve().then(() => {
          if (!cancelled) setLocaleState(next);
        });
      }
      return () => {
        cancelled = true;
      };
    }

    persistLocale(initialLocale);
    return () => {
      cancelled = true;
    };
  }, [initialLocale]);

  const setLocale = useCallback((next: Locale) => {
    const locale = parseLocale(next);
    setLocaleState(locale);
    persistLocale(locale);
  }, []);

  const value = useMemo<I18nContextValue>(() => {
    const dictionary = dictionaries[locale];
    return {
      locale,
      setLocale,
      t: (key, vars) => {
        const template = dictionary.messages[key];
        if (!vars) return template;
        return template.replace(/\{(\w+)\}/g, (_, name: string) =>
          vars[name] === undefined ? `{${name}}` : String(vars[name])
        );
      },
      option: (group, value) => {
        if (!value) return "";
        return dictionary[group][value] ?? value;
      },
    };
  }, [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}
