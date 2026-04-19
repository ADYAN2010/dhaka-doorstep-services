/**
 * Public providers directory — backed by the Express backend
 * (`GET /api/providers`) via `providersApi.list`.
 *
 * Supports filtering by search term, category, area, min rating, and sort.
 * Falls back to a friendly empty / error state and never crashes the page.
 */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, AlertCircle, Filter, RotateCcw } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { RealProviderCard, type RealProvider } from "@/components/real-provider-card";
import { providersApi, type ApiProviderListItem, type ListProvidersParams } from "@/lib/providers-api";
import { ApiError } from "@/lib/api-client";
import { categories as ALL_CATEGORIES } from "@/data/categories";
import { areas as ALL_AREAS } from "@/data/areas";

type Search = {
  q?: string;
  category?: string;
  area?: string;
  minRating?: number;
  sort?: ListProvidersParams["sort"];
  page?: number;
};

export const Route = createFileRoute("/providers/")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    q: typeof search.q === "string" ? search.q : undefined,
    category: typeof search.category === "string" ? search.category : undefined,
    area: typeof search.area === "string" ? search.area : undefined,
    minRating:
      typeof search.minRating === "number"
        ? search.minRating
        : typeof search.minRating === "string"
          ? Number(search.minRating) || undefined
          : undefined,
    sort: (["rating_desc", "reviews_desc", "jobs_desc", "newest"] as const).includes(
      search.sort as never,
    )
      ? (search.sort as Search["sort"])
      : undefined,
    page:
      typeof search.page === "number"
        ? search.page
        : typeof search.page === "string"
          ? Number(search.page) || undefined
          : undefined,
  }),
  component: ProvidersIndexPage,
  head: () => ({
    meta: [
      { title: "Find a verified provider · Shebabd" },
      {
        name: "description",
        content:
          "Browse Shebabd's verified service providers across Dhaka. Filter by category, area and rating to book in minutes.",
      },
      { property: "og:title", content: "Find a verified provider · Shebabd" },
      {
        property: "og:description",
        content:
          "Browse Shebabd's verified service providers across Dhaka. Filter by category, area and rating to book in minutes.",
      },
    ],
  }),
});

const PAGE_SIZE = 12;

function toCardProvider(p: ApiProviderListItem): RealProvider {
  return {
    id: p.id,
    full_name: p.full_name,
    area: p.primary_area,
    avatar_url: p.avatar_url,
    categories: p.categories,
    areas: p.areas,
    avg_rating: p.rating || null,
    review_count: p.review_count,
  };
}

function ProvidersIndexPage() {
  const navigate = useNavigate({ from: Route.fullPath });
  const search = Route.useSearch();

  // Local form state mirrors the URL search params.
  const [q, setQ] = useState(search.q ?? "");
  useEffect(() => setQ(search.q ?? ""), [search.q]);

  const [data, setData] = useState<ApiProviderListItem[] | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const page = search.page && search.page > 0 ? search.page : 1;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    providersApi
      .list({
        q: search.q,
        category: search.category,
        area: search.area,
        minRating: search.minRating,
        sort: search.sort ?? "rating_desc",
        page,
        pageSize: PAGE_SIZE,
      })
      .then((res) => {
        if (cancelled) return;
        setData(res.data);
        setTotal(res.total);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError) {
          setError(
            err.code === "network_error"
              ? "Backend not reachable. Please try again in a moment."
              : err.message,
          );
        } else {
          setError("Failed to load providers.");
        }
        setData([]);
        setTotal(0);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [search.q, search.category, search.area, search.minRating, search.sort, page]);

  function update(next: Partial<Search>) {
    navigate({
      search: (prev: Search) => ({ ...prev, ...next, page: next.page ?? 1 }),
      replace: true,
    });
  }

  function reset() {
    navigate({ search: {}, replace: true });
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = useMemo(
    () => Boolean(search.q || search.category || search.area || search.minRating || search.sort),
    [search],
  );

  return (
    <SiteShell>
      <section className="border-b border-border bg-gradient-to-b from-muted/40 to-background">
        <div className="container-page py-10 md:py-14">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Find a verified provider
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
            Browse our network of vetted professionals. Filter by what you need, where you are, and
            book in minutes.
          </p>

          <form
            className="mt-6 flex flex-col gap-3 md:flex-row md:items-center"
            onSubmit={(e) => {
              e.preventDefault();
              update({ q: q.trim() || undefined });
            }}
          >
            <label className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name, business or specialty…"
                className="h-11 w-full rounded-full border border-border bg-background pl-10 pr-4 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.01]"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      <section className="container-page py-8">
        <div className="grid gap-6 md:grid-cols-[260px_1fr]">
          {/* Filters */}
          <aside className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="inline-flex items-center gap-2 text-sm font-semibold">
                <Filter className="h-4 w-4 text-primary" /> Filters
              </div>
              {hasFilters && (
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="h-3 w-3" /> Reset
                </button>
              )}
            </div>

            <Field label="Category">
              <select
                value={search.category ?? ""}
                onChange={(e) => update({ category: e.target.value || undefined })}
                className="select"
              >
                <option value="">All categories</option>
                {ALL_CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Area">
              <select
                value={search.area ?? ""}
                onChange={(e) => update({ area: e.target.value || undefined })}
                className="select"
              >
                <option value="">All areas</option>
                {ALL_AREAS.map((a) => (
                  <option key={a.slug} value={a.slug}>
                    {a.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Minimum rating">
              <select
                value={search.minRating ?? ""}
                onChange={(e) =>
                  update({ minRating: e.target.value ? Number(e.target.value) : undefined })
                }
                className="select"
              >
                <option value="">Any rating</option>
                <option value="3">3.0+</option>
                <option value="4">4.0+</option>
                <option value="4.5">4.5+</option>
              </select>
            </Field>

            <Field label="Sort by">
              <select
                value={search.sort ?? "rating_desc"}
                onChange={(e) => update({ sort: e.target.value as Search["sort"] })}
                className="select"
              >
                <option value="rating_desc">Top rated</option>
                <option value="reviews_desc">Most reviewed</option>
                <option value="jobs_desc">Most jobs done</option>
                <option value="newest">Newest</option>
              </select>
            </Field>
          </aside>

          {/* Results */}
          <div>
            <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
              <div>
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading providers…
                  </span>
                ) : (
                  <>
                    <span className="font-semibold text-foreground">{total}</span> provider
                    {total === 1 ? "" : "s"}
                    {hasFilters ? " match your filters" : " available"}
                  </>
                )}
              </div>
              {totalPages > 1 && !loading && (
                <div className="text-xs">
                  Page <span className="font-semibold text-foreground">{page}</span> / {totalPages}
                </div>
              )}
            </div>

            {error && (
              <div className="mb-4 flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>{error}</div>
              </div>
            )}

            {!loading && data && data.length === 0 && !error && (
              <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-10 text-center">
                <p className="text-sm font-semibold text-foreground">No providers found</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try clearing some filters or searching for a different term.
                </p>
                {hasFilters && (
                  <button
                    type="button"
                    onClick={reset}
                    className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-xs font-medium hover:bg-muted"
                  >
                    <RotateCcw className="h-3 w-3" /> Clear filters
                  </button>
                )}
              </div>
            )}

            {loading && !data && (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-48 animate-pulse rounded-2xl border border-border bg-muted/40"
                  />
                ))}
              </div>
            )}

            {data && data.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {data.map((p) => (
                  <RealProviderCard key={p.id} provider={toCardProvider(p)} />
                ))}
              </div>
            )}

            {totalPages > 1 && data && data.length > 0 && (
              <nav className="mt-8 flex items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => update({ page: page - 1 })}
                  className="inline-flex items-center rounded-full border border-border bg-background px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40 hover:bg-muted"
                >
                  ← Previous
                </button>
                <span className="text-xs text-muted-foreground">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => update({ page: page + 1 })}
                  className="inline-flex items-center rounded-full border border-border bg-background px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40 hover:bg-muted"
                >
                  Next →
                </button>
              </nav>
            )}
          </div>
        </div>
      </section>

      <style>{`
        .select {
          margin-top: 0.25rem;
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--background));
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
        }
        .select:focus { border-color: hsl(var(--primary)); box-shadow: 0 0 0 3px hsl(var(--primary)/0.2); }
      `}</style>
    </SiteShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mb-3 block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
