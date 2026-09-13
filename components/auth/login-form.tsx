"use client";

import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";
import { safeNextPath } from "@/lib/auth/paths";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

export function LoginForm() {
  const { t } = useI18n();
  const { signIn, requiresAuth, ready, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const nextPath = safeNextPath(searchParams.get("next"));

  useEffect(() => {
    if (!ready) return;
    if (!requiresAuth) {
      router.replace("/");
      return;
    }
    if (user) {
      router.replace(nextPath);
    }
  }, [nextPath, ready, requiresAuth, router, user]);

  if (!requiresAuth || user) {
    return null;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email, password);
      router.replace(nextPath);
      router.refresh();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "";
      setError(
        /invalid login credentials/i.test(message)
          ? t("invalidCredentials")
          : t("loginFailed")
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-end">
          <LanguageSwitcher />
        </div>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-1">
            <h1 className="text-xl font-semibold tracking-tight">{t("appName")}</h1>
            <p className="text-sm text-muted-foreground">{t("tagline")}</p>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="password">{t("password")}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" disabled={submitting}>
            {submitting ? t("signingIn") : t("signIn")}
          </Button>
        </form>
      </div>
    </div>
  );
}
