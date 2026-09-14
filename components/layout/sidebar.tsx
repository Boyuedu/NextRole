"use client";

import { AccountArea } from "@/components/auth/account-area";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/use-i18n";
import { useTracker } from "@/hooks/use-tracker";
import { categoryLabel, sortCategories } from "@/lib/classifications";
import { buildListHref, hasListFilters, parseListQuery } from "@/lib/filters";
import { cn } from "@/lib/utils";
import {
  ArchiveIcon,
  BriefcaseIcon,
  ChevronDownIcon,
  LayoutGridIcon,
  SettingsIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { type ReactNode, useState } from "react";
import { useIsClient } from "@/hooks/use-is-client";

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const mounted = useIsClient();

  if (!mounted) {
    return (
      <div className="flex h-full flex-col bg-zinc-50">
        <div className="px-5 pt-5 pb-4">
          <Brand />
        </div>
        <div className="mt-auto grid gap-3 border-t border-border px-4 py-3">
          <AccountArea />
          <LanguageSwitcher />
        </div>
      </div>
    );
  }

  return <SidebarNav onNavigate={onNavigate} />;
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { t, locale, option } = useI18n();
  const { categories, ready } = useTracker();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = parseListQuery(searchParams);
  const onHome = pathname === "/";
  const onSettings = pathname.startsWith("/settings");
  const regions = sortCategories(
    categories.filter((category) => category.type === "region")
  );
  const functions = sortCategories(
    categories.filter((category) => category.type === "function")
  );
  const unfilteredHome =
    onHome && !filters.archived && !hasListFilters({ ...filters, search: "" });

  if (!ready) {
    return (
      <div className="flex h-full flex-col bg-zinc-50">
        <div className="px-5 pt-5 pb-4">
          <Brand />
        </div>
        <div className="mt-auto grid gap-3 border-t border-border px-4 py-3">
          <AccountArea />
          <LanguageSwitcher />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-zinc-50">
      <div className="px-5 pt-5 pb-4">
        <Link href="/" onClick={onNavigate}>
          <Brand />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <NavLink
          href="/"
          label={t("applications")}
          icon={<LayoutGridIcon className="size-4" />}
          active={
            pathname.startsWith("/applications") || unfilteredHome
          }
          onClick={onNavigate}
        />

        <SidebarSection title={t("views")} english={locale === "en"}>
          <NavLink
            href={buildListHref({})}
            label={t("all")}
            active={unfilteredHome}
            onClick={onNavigate}
          />
          <NavLink
            href={buildListHref({ status: "active" })}
            label={t("active")}
            active={
              onHome &&
              filters.status === "active" &&
              !filters.archived &&
              !filters.regionId &&
              !filters.functionId
            }
            onClick={onNavigate}
          />
          <NavLink
            href={buildListHref({ status: "ended" })}
            label={t("ended")}
            active={
              onHome &&
              filters.status === "ended" &&
              !filters.archived &&
              !filters.regionId &&
              !filters.functionId
            }
            onClick={onNavigate}
          />
        </SidebarSection>

        <SidebarSection title={t("regions")} english={locale === "en"}>
          {regions.length === 0 ? (
            <p className="px-2 py-1 text-xs text-muted-foreground">
              {t("noRegionsYet")}
            </p>
          ) : (
            regions.map((category) => (
              <NavLink
                key={category.id}
                href={buildListHref({ regionId: category.id })}
                label={category.name}
                active={
                  onHome &&
                  filters.regionId === category.id &&
                  !filters.archived
                }
                onClick={onNavigate}
              />
            ))
          )}
        </SidebarSection>

        <SidebarSection title={t("functions")} english={locale === "en"}>
          {functions.length === 0 ? (
            <p className="px-2 py-1 text-xs text-muted-foreground">
              {t("noFunctionsYet")}
            </p>
          ) : (
            functions.map((category) => (
              <NavLink
                key={category.id}
                href={buildListHref({ functionId: category.id })}
                label={categoryLabel(category, option)}
                active={
                  onHome &&
                  filters.functionId === category.id &&
                  !filters.archived
                }
                onClick={onNavigate}
              />
            ))
          )}
        </SidebarSection>

        <div className="mt-5">
          <NavLink
            href={buildListHref({ archived: true })}
            label={t("archived")}
            icon={<ArchiveIcon className="size-4" />}
            active={onHome && filters.archived}
            onClick={onNavigate}
          />
          <NavLink
            href="/settings"
            label={t("settings")}
            icon={<SettingsIcon className="size-4" />}
            active={onSettings}
            onClick={onNavigate}
          />
        </div>
      </nav>

      <div className="grid gap-3 border-t border-border px-4 py-3">
        <AccountArea />
        <LanguageSwitcher />
      </div>
    </div>
  );
}

function SidebarSection({
  title,
  english,
  children,
}: {
  title: string;
  english: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className={cn(
          "flex w-full items-center justify-between px-2 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground",
          english && "uppercase"
        )}
      >
        {title}
        <ChevronDownIcon
          className={cn("size-3.5 transition", open ? "" : "rotate-[-90deg]")}
        />
      </button>
      {open ? children : null}
    </div>
  );
}

function Brand() {
  const { t } = useI18n();
  return (
    <span className="flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground">
      <span className="flex size-7 items-center justify-center rounded-lg border border-border bg-white">
        <BriefcaseIcon className="size-3.5" />
      </span>
      {t("appName")}
    </span>
  );
}

function NavLink({
  href,
  label,
  icon,
  active,
  onClick,
}: {
  href: string;
  label: string;
  icon?: ReactNode;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm whitespace-nowrap text-zinc-600 hover:bg-zinc-100 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        active && "bg-white text-foreground ring-1 ring-border"
      )}
      title={label}
    >
      {icon}
      <span className="min-w-0 truncate">{label}</span>
    </Link>
  );
}

export function SidebarTriggerButton({ onClick }: { onClick: () => void }) {
  const { t } = useI18n();
  return (
    <Button variant="outline" size="icon-sm" onClick={onClick} className="md:hidden">
      <span className="sr-only">{t("openNavigation")}</span>
      <svg viewBox="0 0 16 16" className="size-4" fill="none">
        <path
          d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    </Button>
  );
}
