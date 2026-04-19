/**
 * use-favorite-services — local favorites for services (separate from saved providers).
 *
 * Stored in localStorage. When the favorites table exists in the DB, swap reads/writes
 * for a `service_favorites` service while keeping the same hook interface.
 */

import { useCallback, useEffect, useState } from "react";

const KEY = "shebabd:fav-services:v1";

export type FavoriteService = {
  slug: string;
  name: string;
  categorySlug: string;
  category: string;
  startingPrice?: number;
  savedAt: string;
};

function read(): FavoriteService[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FavoriteService[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(items: FavoriteService[]) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* silent */ }
}

export function useFavoriteServices() {
  const [items, setItems] = useState<FavoriteService[]>([]);

  useEffect(() => {
    setItems(read());
    const onStorage = (e: StorageEvent) => { if (e.key === KEY) setItems(read()); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const isFavorite = useCallback((slug: string) => items.some((x) => x.slug === slug), [items]);

  const toggle = useCallback((s: Omit<FavoriteService, "savedAt">) => {
    const current = read();
    const exists = current.find((x) => x.slug === s.slug);
    const next = exists
      ? current.filter((x) => x.slug !== s.slug)
      : [{ ...s, savedAt: new Date().toISOString() }, ...current];
    write(next);
    setItems(next);
    return !exists; // returns new favorited state
  }, []);

  const remove = useCallback((slug: string) => {
    const next = read().filter((x) => x.slug !== slug);
    write(next);
    setItems(next);
  }, []);

  return { items, isFavorite, toggle, remove };
}
