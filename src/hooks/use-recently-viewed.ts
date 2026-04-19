/**
 * use-recently-viewed — tracks the last N service slugs the user opened.
 *
 * Persists to localStorage so it survives reloads and works without a backend.
 * When real auth + DB tables land, swap the read/write to call a service.
 */

import { useCallback, useEffect, useState } from "react";

const KEY = "shebabd:recent-services:v1";
const MAX = 8;

export type RecentService = {
  slug: string;       // service slug (or category slug fallback)
  name: string;
  category: string;   // category name (display)
  categorySlug: string;
  startingPrice?: number;
  viewedAt: string;   // ISO
};

function read(): RecentService[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentService[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX) : [];
  } catch {
    return [];
  }
}

function write(items: RecentService[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX)));
  } catch {
    /* quota / private mode — silent */
  }
}

export function useRecentlyViewed() {
  const [items, setItems] = useState<RecentService[]>([]);

  useEffect(() => {
    setItems(read());
    const onStorage = (e: StorageEvent) => { if (e.key === KEY) setItems(read()); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const track = useCallback((s: Omit<RecentService, "viewedAt">) => {
    const next = [{ ...s, viewedAt: new Date().toISOString() }, ...read().filter((x) => x.slug !== s.slug)].slice(0, MAX);
    write(next);
    setItems(next);
  }, []);

  const clear = useCallback(() => { write([]); setItems([]); }, []);

  const remove = useCallback((slug: string) => {
    const next = read().filter((x) => x.slug !== slug);
    write(next);
    setItems(next);
  }, []);

  return { items, track, clear, remove };
}
