"use client";

import { getSupabaseClient } from "@/lib/supabase/client";
import { isProductionRuntime } from "@/lib/supabase/env";
import type { User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type AuthUser = {
  id: string;
  email: string | null;
};

interface AuthContextValue {
  ready: boolean;
  requiresAuth: boolean;
  configError: boolean;
  user: AuthUser | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toAuthUser(user: User | null): AuthUser | null {
  if (!user) return null;
  return { id: user.id, email: user.email ?? null };
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
  const [ready, setReady] = useState(!requiresAuth);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    if (!requiresAuth) {
      return;
    }

    const supabase = getSupabaseClient();
    let active = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setUser(toAuthUser(data.session?.user ?? null));
        setReady(true);
      })
      .catch((error) => {
        console.error(error);
        if (!active) return;
        setUser(null);
        setReady(true);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(toAuthUser(session?.user ?? null));
      setReady(true);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [requiresAuth]);

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      requiresAuth,
      configError,
      user,
      signIn,
      signOut,
    }),
    [configError, ready, requiresAuth, signIn, signOut, user]
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
