/**
 * `useSavedProvider` — backed by /api/saved-providers on the Express backend.
 * Loads the customer's saved-provider id list once into a tiny in-memory
 * cache, then exposes optimistic toggle for one provider id.
 */
import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api-client";
import { savedProvidersApi } from "@/lib/providers-api";
import { useBackendAuth } from "@/components/backend-auth-provider";

let cache: Set<string> | null = null;
const subs = new Set<() => void>();

function setCache(next: Set<string>) {
  cache = next;
  subs.forEach((fn) => fn());
}

async function ensureLoaded(signedIn: boolean) {
  if (!signedIn) {
    setCache(new Set());
    return;
  }
  if (cache !== null) return;
  try {
    const res = await savedProvidersApi.listIds();
    setCache(new Set(res.data));
  } catch (err) {
    if (!(err instanceof ApiError) || err.status !== 401) {
      console.warn("[saved-providers] list failed:", err);
    }
    setCache(new Set());
  }
}

export function useSavedProvider(providerId: string) {
  const { user } = useBackendAuth();
  const signedIn = !!user;
  const [, force] = useState(0);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    const fn = () => force((n) => n + 1);
    subs.add(fn);
    void ensureLoaded(signedIn);
    return () => {
      subs.delete(fn);
    };
  }, [signedIn]);

  const saved = !!cache && cache.has(providerId);

  const toggle = useCallback(async () => {
    if (!signedIn || working) return;
    setWorking(true);
    const next = new Set(cache ?? []);
    const wasSaved = next.has(providerId);
    if (wasSaved) next.delete(providerId);
    else next.add(providerId);
    setCache(next);
    try {
      if (wasSaved) await savedProvidersApi.unsave(providerId);
      else await savedProvidersApi.save(providerId);
    } catch (err) {
      const revert = new Set(cache ?? []);
      if (wasSaved) revert.add(providerId);
      else revert.delete(providerId);
      setCache(revert);
      console.warn("[saved-providers] toggle failed:", err);
    } finally {
      setWorking(false);
    }
  }, [providerId, signedIn, working]);

  return { saved, working, signedIn, toggle };
}
