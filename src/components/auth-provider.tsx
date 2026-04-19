/**
 * AuthProvider — Supabase Auth.
 *
 * Single source of truth for the customer-facing auth state. Exposes the same
 * surface the rest of the app already imports:
 *
 *   const { user, session, loading, roles, signIn, signUp, signOut, refresh } = useAuth();
 *
 * - `user` / `session` come from supabase.auth.
 * - `roles` is loaded from public.user_roles (uses the existing has_role()
 *   pattern). Triggers in the database (handle_new_user) auto-create a
 *   profiles + customer user_roles row on signup.
 * - signUp accepts `{ email, password, full_name, phone, area }`. Provider
 *   intent (the role toggle on /signup) is passed through user_metadata so
 *   handle_new_user can stamp `provider_status = pending`.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "customer" | "provider" | "admin";

export type AuthUser = User;

type AuthContextValue = {
  session: Session | null;
  user: AuthUser | null;
  /** Roles loaded from public.user_roles for the current user. */
  roles: AppRole[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signUp: (input: {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    area?: string;
    role?: "customer" | "provider";
  }) => Promise<AuthUser | null>;
  signOut: () => Promise<void>;
  /** Re-fetch roles for the current session. */
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchRoles(userId: string): Promise<AppRole[]> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) {
    // Don't blow up the app if role lookup fails — just treat as no roles yet.
    console.warn("[auth] failed to load roles:", error.message);
    return [];
  }
  return (data ?? []).map((r) => r.role as AppRole);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const initialised = useRef(false);

  const loadRoles = useCallback(async (uid: string | null) => {
    if (!uid) {
      setRoles([]);
      return;
    }
    const r = await fetchRoles(uid);
    setRoles(r);
  }, []);

  useEffect(() => {
    if (initialised.current) return;
    initialised.current = true;

    // Set up listener FIRST, then fetch session — avoids missing the initial
    // SIGNED_IN event when restoring from storage.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      // Defer the role fetch to avoid running async work inside the callback.
      if (sess?.user) {
        setTimeout(() => {
          void loadRoles(sess.user.id);
        }, 0);
      } else {
        setRoles([]);
      }
    });

    void supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        void loadRoles(sess.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [loadRoles]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.user) throw new Error("Sign in returned no user");
    return data.user;
  }, []);

  const signUp = useCallback(
    async (input: {
      email: string;
      password: string;
      full_name: string;
      phone?: string;
      area?: string;
      role?: "customer" | "provider";
    }) => {
      const redirectTo =
        typeof window !== "undefined" ? `${window.location.origin}/` : undefined;
      const { data, error } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            full_name: input.full_name,
            phone: input.phone ?? null,
            area: input.area ?? null,
            role: input.role ?? "customer",
          },
        },
      });
      if (error) throw error;
      return data.user;
    },
    [],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setRoles([]);
  }, []);

  const refresh = useCallback(async () => {
    if (user?.id) await loadRoles(user.id);
  }, [user?.id, loadRoles]);

  const value = useMemo<AuthContextValue>(
    () => ({ session, user, roles, loading, signIn, signUp, signOut, refresh }),
    [session, user, roles, loading, signIn, signUp, signOut, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
