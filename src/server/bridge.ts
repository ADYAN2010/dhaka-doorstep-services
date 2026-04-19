/**
 * Server-only client for the Hostinger PHP bridge.
 * Signs every request with HMAC-SHA256 over `<ts>.<nonce>.<body>`.
 * Never import this from client code — it reads `process.env` and uses
 * the shared bridge secret.
 */
import { createHmac, randomBytes } from "node:crypto";

const TIMEOUT_MS = 15_000;
const MAX_RETRIES = 1;

export type BridgeError = {
  code: string;
  message: string;
  http?: number;
};

export class BridgeException extends Error {
  code: string;
  http: number;
  constructor(err: BridgeError) {
    super(err.message);
    this.code = err.code;
    this.http = err.http ?? 500;
  }
}

function getEnv() {
  const url = process.env.HOSTINGER_BRIDGE_URL;
  const secret = process.env.HOSTINGER_BRIDGE_SECRET;
  if (!url || !secret) {
    throw new BridgeException({
      code: "bridge_unconfigured",
      message:
        "Hostinger bridge is not configured. Set HOSTINGER_BRIDGE_URL and HOSTINGER_BRIDGE_SECRET.",
      http: 500,
    });
  }
  return { url, secret };
}

async function callOnce<T>(action: string, params: Record<string, unknown>): Promise<T> {
  const { url, secret } = getEnv();
  const body = JSON.stringify({ action, params });
  const ts = Math.floor(Date.now() / 1000).toString();
  const nonce = randomBytes(12).toString("hex");
  const sig = createHmac("sha256", secret).update(`${ts}.${nonce}.${body}`).digest("hex");

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        "Content-Type": "application/json",
        "X-Bridge-Ts": ts,
        "X-Bridge-Nonce": nonce,
        "X-Bridge-Sig": sig,
      },
      body,
    });
  } catch (e) {
    clearTimeout(timer);
    throw new BridgeException({
      code: "bridge_unreachable",
      message: `Bridge unreachable: ${(e as Error).message}`,
      http: 502,
    });
  }
  clearTimeout(timer);

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new BridgeException({
      code: "bad_response",
      message: "Bridge returned non-JSON response.",
      http: 502,
    });
  }

  const obj = json as { data?: T; error?: BridgeError };
  if (obj.error) {
    throw new BridgeException({ ...obj.error, http: res.status });
  }
  return obj.data as T;
}

export async function bridgeCall<T = unknown>(
  action: string,
  params: Record<string, unknown> = {},
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await callOnce<T>(action, params);
    } catch (e) {
      lastErr = e;
      if (e instanceof BridgeException) {
        // Retry only on transient network/gateway errors
        if (e.code === "bridge_unreachable" || e.http >= 502) continue;
        throw e;
      }
      throw e;
    }
  }
  throw lastErr;
}
