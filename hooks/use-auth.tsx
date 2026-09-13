"use client";

import { getSupabaseClient } from "@/lib/supabase/client";
import { isProductionRuntime } from "@/lib/supabase/env";
import type { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type AuthStatus = "initializing" | "authenticated" | "unauthenticated";

export type AuthUser = {
  id: string;
  email: string | null;
};

interface AuthContextValue {
  status: AuthStatus;
  ready: boolean;
  requiresAuth: boolean;
  configError: boolean;
  user: AuthUser | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toAuthUser(user: User | null | undefined): AuthUser | null {
  if (!user) return null;
  return { id: user.id, email: user.email ?? null };
}

function applySession(
  session: Session | null,
  setUser: (user: AuthUser | null) => void,
  setStatus: (status: AuthStatus) => void
) {
  const nextUser = toAuthUser(session?.user ?? null);
  setUser(nextUser);
  setStatus(nextUser ? "authenticated" : "unauthenticated");
}

export function AuthProvider({
  children,
  supabaseConfigured,
}: {
  children: ReactNode;
  supabaseConfigured: boolean;
}) {
  const requiresAuth = supabaseConfigured;
  const configError = isProductionRuntime() && !requiresAuth;
  const [status, setStatus] = useState<AuthStatus>(
    requiresAuth ? "initializing" : "unauthenticated"
  );
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    if (!requiresAuth) {
      return;
    }

    const supabase = getSupabaseClient();
    let active = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      applySession(session, setUser, setStatus);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [requiresAuth]);

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;
    if (!data.session?.user) {
      throw new Error("Sign in failed.");
    }
    applySession(data.session, setUser, setStatus);
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    applySession(null, setUser, setStatus);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      ready: status !== "initializing",
      requiresAuth,
      configError,
      user,
      signIn,
      signOut,
    }),
    [configError, requiresAuth, signIn, signOut, status, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
