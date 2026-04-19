import { createFileRoute, Link, useRouter, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, BadgeCheck, CalendarRange, Loader2, MapPin, Star } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { SavedHeartButton } from "@/components/saved-heart-button";
import { categories as ALL_CATEGORIES } from "@/data/categories";
import { areas as ALL_AREAS } from "@/data/areas";
import { supabase } from "@/integrations/supabase/client";
import { buildSeo } from "@/lib/seo";

type ProviderDetail = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  area: string | null;
  categories: string[];
  areas: string[];
  avg_rating: number | null;
  review_count: number;
};

type ReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_id: string;
};

export const Route = createFileRoute("/p/$id")({
  component: ProviderProfilePage,
  head: ({ params }) => ({
    ...buildSeo({
      title: "Verified provider — Shebabd",
      description:
        "View this verified Shebabd professional's services, coverage areas, and reviews. Book trusted help in Dhaka.",
      canonical: `/p/${params.id}`,
      type: "profile",
    }),
  }),
  notFoundComponent: () => (
    <SiteShell>
      <section className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
        <h1 className="text-3xl font-bold">Provider not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This profile may have been removed or is no longer active.
        </p>
        <Link to="/providers" className="mt-6">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to providers
          </Button>
        </Link>
      </section>
    </SiteShell>
  ),
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <SiteShell>
        <section className="container-page py-16 text-center">
          <h1 className="text-2xl font-bold">Couldn't load this profile</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
          <Button
            className="mt-6"
            variant="outline"
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            Retry
          </Button>
        </section>
      </SiteShell>
    );
  },
});

function ProviderProfilePage() {
  const { id } = Route.useParams();
  const [provider, setProvider] = useState<ProviderDetail | null>(null);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFoundFlag, setNotFoundFlag] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      setNotFoundFlag(false);
      try {
        const { data: profile, error: pErr } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, area, provider_status")
          .eq("id", id)
          .maybeSingle();
        if (pErr) throw pErr;
        if (!profile || profile.provider_status !== "approved") {
          if (!cancelled) {
            setNotFoundFlag(true);
            setLoading(false);
          }
          return;
        }

        const [catsRes, areasRes, statsRes, reviewsRes] = await Promise.all([
          supabase.from("provider_categories").select("category").eq("user_id", id),
          supabase.from("provider_areas").select("area").eq("user_id", id),
          supabase
            .from("provider_review_stats")
            .select("avg_rating, review_count")
            .eq("provider_id", id)
            .maybeSingle(),
          supabase
            .from("reviews")
            .select("id, rating, comment, created_at, user_id")
            .eq("provider_id", id)
            .order("created_at", { ascending: false })
            .limit(20),
        ]);

        if (catsRes.error) throw catsRes.error;
        if (areasRes.error) throw areasRes.error;
        if (reviewsRes.error) throw reviewsRes.error;

        if (!cancelled) {
          setProvider({
            id: profile.id,
            full_name: profile.full_name || "Verified provider",
            avatar_url: profile.avatar_url,
            area: profile.area,
            categories: (catsRes.data ?? []).map((r) => r.category),
            areas: (areasRes.data ?? []).map((r) => r.area),
            avg_rating: statsRes.data?.avg_rating !== null && statsRes.data?.avg_rating !== undefined
              ? Number(statsRes.data.avg_rating)
              : null,
            review_count: Number(statsRes.data?.review_count ?? 0),
          });
          setReviews((reviewsRes.data ?? []) as ReviewRow[]);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load provider");
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <SiteShell>
        <div className="flex items-center justify-center py-32 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading profile…
        </div>
      </SiteShell>
    );
  }

  if (notFoundFlag) throw notFound();

  if (error || !provider) {
    return (
      <SiteShell>
        <section className="container-page py-16 text-center">
          <h1 className="text-2xl font-bold">Couldn't load this profile</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <Link to="/providers" className="mt-6 inline-block">
            <Button variant="outline">Back to providers</Button>
          </Link>
        </section>
      </SiteShell>
    );
  }

  const initials = provider.full_name
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const categoryNames = provider.categories
    .map((slug) => ALL_CATEGORIES.find((c) => c.slug === slug)?.name ?? slug)
    .join(", ");
  const areaNames = provider.areas
    .map((slug) => ALL_AREAS.find((a) => a.slug === slug)?.name ?? slug)
    .join(", ");

  return (
    <SiteShell>
      <section className="border-b border-border bg-gradient-subtle">
        <div className="container-page py-10">
          <Link
            to="/providers"
            className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> All providers
          </Link>
          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-primary text-2xl font-bold text-primary-foreground">
              {provider.avatar_url ? (
                <img src={provider.avatar_url} alt={provider.full_name} className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight">{provider.full_name}</h1>
                <BadgeCheck className="h-6 w-6 text-primary" aria-label="Verified" />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {categoryNames || "Verified Shebabd professional"}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-warning text-warning" />
                  <span className="font-semibold text-foreground">
                    {provider.avg_rating !== null ? provider.avg_rating.toFixed(1) : "New"}
                  </span>
                  <span>({provider.review_count} reviews)</span>
                </span>
                {areaNames && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" /> {areaNames}
                  </span>
                )}
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link to="/book">
                  <Button>
                    <CalendarRange className="mr-2 h-4 w-4" /> Book this provider
                  </Button>
                </Link>
                <SavedHeartButton providerId={provider.id} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page grid gap-8 py-10 lg:grid-cols-[2fr_1fr]">
        <div>
          <h2 className="text-xl font-semibold">Recent reviews</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            What customers say after working with {provider.full_name.split(" ")[0]}.
          </p>
          <div className="mt-5 space-y-4">
            {reviews.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
                No reviews yet — be the first after your booking.
              </div>
            ) : (
              reviews.map((r) => (
                <article key={r.id} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={
                            i < r.rating
                              ? "h-4 w-4 fill-warning text-warning"
                              : "h-4 w-4 text-muted-foreground/40"
                          }
                        />
                      ))}
                    </div>
                    <time className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString()}
                    </time>
                  </div>
                  {r.comment && (
                    <p className="mt-3 text-sm text-foreground/90">{r.comment}</p>
                  )}
                </article>
              ))
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground">Services</h3>
            <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              {provider.categories.length === 0 ? (
                <li>General professional services</li>
              ) : (
                provider.categories.map((slug) => (
                  <li key={slug}>
                    {ALL_CATEGORIES.find((c) => c.slug === slug)?.name ?? slug}
                  </li>
                ))
              )}
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground">Coverage</h3>
            <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              {provider.areas.length === 0 ? (
                <li>{provider.area || "Dhaka"}</li>
              ) : (
                provider.areas.map((slug) => (
                  <li key={slug}>{ALL_AREAS.find((a) => a.slug === slug)?.name ?? slug}</li>
                ))
              )}
            </ul>
          </div>
        </aside>
      </section>
    </SiteShell>
  );
}
