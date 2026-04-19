/**
 * BackendAuthProvider — frontend auth context for the Express /api backend.
 *
 * - On mount, reads JWT from localStorage (via api-client) and calls
 *   GET /api/auth/me to hydrate the current user.
 * - login(email, password) → POST /api/auth/login, stores JWT, sets user.
 * - logout() → clears JWT and user.
 * - Exposes loading/user/login/logout via useBackendAuth().
 *
 * The JWT itself is managed by src/lib/api-client.ts (setAuthToken /
 * getAuthToken). This context just mirrors the auth state into React.
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

export type BackendUser = {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  last_login_at?: string | null;
};

type LoginResponse = {
  token: string;
  expires_in: string;
  user: BackendUser;
};

type MeResponse = { user: BackendUser };

type Ctx = {
  /** True until the initial /me check has resolved (or skipped). */
  loading: boolean;
  /** Current user, or null if not signed in. */
  user: BackendUser | null;
  /** Convenience flag. */
  isAuthenticated: boolean;
  /** Sign in via the backend, persist JWT, return the user. */
  login: (email: string, password: string) => Promise<BackendUser>;
  /** Clear JWT + user. */
  logout: () => void;
  /** Re-fetch /me (e.g. after a profile update). */
  refresh: () => Promise<void>;
};

const BackendAuthContext = createContext<Ctx | null>(null);

export function BackendAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<BackendUser | null>(null);
  const [loading, setLoading] = useState(true);
  const hydrated = useRef(false);

  const hydrate = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api<MeResponse>("/api/auth/me");
      setUser(res.user);
    } catch (err) {
      // 401 → api-client already cleared the bad token.
      if (!(err instanceof ApiError) || err.status !== 401) {
        // Network error — keep token but treat as logged out for now.
        console.warn("[BackendAuth] /me failed:", err);
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

  const login = useCallback(async (email: string, password: string) => {
    const res = await api<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: { email, password },
      skipAuth: true,
    });
    setAuthToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(() => {
    setAuthToken(null);
    setUser(null);
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      loading,
      user,
      isAuthenticated: !!user,
      login,
      logout,
      refresh: hydrate,
    }),
    [loading, user, login, logout, hydrate],
  );

  return <BackendAuthContext.Provider value={value}>{children}</BackendAuthContext.Provider>;
}

export function useBackendAuth(): Ctx {
  const ctx = useContext(BackendAuthContext);
  if (!ctx) {
    throw new Error("useBackendAuth must be used inside <BackendAuthProvider>");
  }
  return ctx;
}
