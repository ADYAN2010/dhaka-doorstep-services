/**
 * AuthProvider — MySQL-backed customer auth (was previously Supabase).
 *
 * Talks to the Express backend at /api/customer-auth/*. Drop-in replacement
 * for the old Supabase auth context — exposes a similar surface so existing
 * pages keep working:
 *
 *   const { user, loading, signOut, signIn, signUp, roles } = useAuth();
 *
 * Notes:
 * - `roles` is derived from the JWT role claim ("customer"). Provider/admin
 *   are not selectable from the customer auth flow; admins use the separate
 *   BackendAuthProvider on the /admin/backend route group.
 * - `session` is a thin shape kept for backward compat — only `user` and
 *   the access token are real here.
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
import { api, ApiError, getAuthToken, setAuthToken } from "@/lib/api-client";

type AppRole = "customer" | "provider" | "admin";

export type AuthUser = {
  id: string;
  email: string;
  full_name?: string;
  phone?: string | null;
  area?: string | null;
  role: AppRole;
};

type LoginResponse = { token: string; expires_in: string; user: AuthUser };
type MeResponse = { user: AuthUser };

type AuthContextValue = {
  /** Convenience: { user } shape mirroring the old Supabase `Session`. */
  session: { user: AuthUser } | null;
  user: AuthUser | null;
  /** Roles array for back-compat. Always [user.role] when logged in. */
  roles: AppRole[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signUp: (input: {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    area?: string;
  }) => Promise<AuthUser>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const CUSTOMER_TOKEN_KEY = "shobsheba.customer_token";

// Customer auth uses a separate token slot from the admin token.
function readCustomerToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(CUSTOMER_TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeCustomerToken(token: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (token) window.localStorage.setItem(CUSTOMER_TOKEN_KEY, token);
    else window.localStorage.removeItem(CUSTOMER_TOKEN_KEY);
  } catch {
    /* ignore */
  }
  // The shared api-client uses a single token slot. Mirror to it so the
  // Authorization header gets attached on customer-side calls.
  setAuthToken(token);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const hydrated = useRef(false);

  const hydrate = useCallback(async () => {
    const token = readCustomerToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    // Make sure api-client has the customer token before calling /me
    setAuthToken(token);
    try {
      const res = await api<MeResponse>("/api/customer-auth/me");
      setUser(res.user);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        writeCustomerToken(null);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    void hydrate();
  }, [hydrate]);

  const signIn = useCallback(async (email: string, password: string) => {
    const res = await api<LoginResponse>("/api/customer-auth/login", {
      method: "POST",
      body: { email, password },
      skipAuth: true,
    });
    writeCustomerToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const signUp = useCallback(
    async (input: { email: string; password: string; full_name: string; phone?: string; area?: string }) => {
      const res = await api<LoginResponse>("/api/customer-auth/signup", {
        method: "POST",
        body: input,
        skipAuth: true,
      });
      writeCustomerToken(res.token);
      setUser(res.user);
      return res.user;
    },
    [],
  );

  const signOut = useCallback(async () => {
    writeCustomerToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session: user ? { user } : null,
      user,
      roles: user ? [user.role] : [],
      loading,
      signIn,
      signUp,
      signOut,
      refresh: hydrate,
    }),
    [user, loading, signIn, signUp, signOut, hydrate],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
