/**
 * Tiny typed fetch wrapper for the Express backend.
 * The frontend talks ONLY to this API — never to MySQL directly.
 *
 * Configure the base URL in your frontend .env:
 *   VITE_API_BASE_URL=https://api.your-domain.com    (production)
 *   VITE_API_BASE_URL=http://localhost:4000          (local dev)
 *
 * Auth: after POST /api/auth/login, call setAuthToken(token).
 * The token is persisted to localStorage and sent as Bearer on every call.
 */

const RAW_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "");
const IS_DEV = Boolean((import.meta as any).env?.DEV);

// In dev we fall back to a local backend; in production we REQUIRE the env var
// so we never silently point a deployed frontend at localhost.
const BASE_URL = RAW_BASE || (IS_DEV ? "http://localhost:4000" : "");

if (!BASE_URL && typeof window !== "undefined") {
  // eslint-disable-next-line no-console
  console.error(
    "[api-client] VITE_API_BASE_URL is not set. Set it to your deployed backend URL " +
      "(e.g. https://api.your-domain.com) and rebuild the frontend.",
  );
}

/** Public read-only accessor for the configured API base URL. */
export function getApiBaseUrl(): string {
  return BASE_URL;
}

/** True when VITE_API_BASE_URL was explicitly provided at build time. */
export function isApiBaseUrlConfigured(): boolean {
  return Boolean(RAW_BASE);
}

const TOKEN_KEY = "shobsheba.admin_token";

function readToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage blocked — caller can fall back */
  }
}

export function getAuthToken(): string | null {
  return readToken();
}

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;
  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type Options = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  /** Skip the Authorization header (for /auth/login etc.). */
  skipAuth?: boolean;
};

export async function api<T = unknown>(path: string, opts: Options = {}): Promise<T> {
  const url = new URL(path.startsWith("/") ? path : `/${path}`, BASE_URL);
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers ?? {}),
  };
  if (!opts.skipAuth) {
    const token = readToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method: opts.method ?? "GET",
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal,
    });
  } catch (e) {
    // fetch() rejects only on network failure / CORS / aborted — surface as a
    // typed ApiError so callers can show "Backend not reachable at <url>".
    if ((e as Error)?.name === "AbortError") throw e;
    throw new ApiError(
      0,
      "network_error",
      `Backend not reachable at ${BASE_URL}`,
      { cause: (e as Error)?.message },
    );
  }

  if (res.status === 204) return undefined as T;

  let json: any = null;
  try {
    json = await res.json();
  } catch {
    /* non-JSON */
  }

  if (!res.ok) {
    // Auto-clear token on auth failure so the UI can route to /login.
    if (res.status === 401) setAuthToken(null);
    const err = json?.error ?? {};
    throw new ApiError(
      res.status,
      err.code ?? "request_failed",
      err.message ?? `Request failed (${res.status})`,
      err.details,
    );
  }
  return json as T;
}
