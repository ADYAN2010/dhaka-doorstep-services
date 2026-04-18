import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, BadgeCheck, Heart, Loader2, MapPin, Star } from "lucide-react";
import { toast } from "sonner";
import { SiteShell } from "@/components/site-shell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth-provider";
import { useSavedProvider } from "@/hooks/use-saved-provider";
import { StarRating } from "@/components/star-rating";
import { areas as ALL_AREAS } from "@/data/areas";
import { categories as ALL_CATEGORIES } from "@/data/categories";

export const Route = createFileRoute("/p/$id")({
  loader: async ({ params }) => {
    // Validate UUID-ish (postgres will reject otherwise) & fetch profile + coverage + stats
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name, area, avatar_url, provider_status")
      .eq("id", params.id)
      .maybeSingle();
    if (!profile || profile.provider_status !== "approved") throw notFound();

    const [{ data: cats }, { data: ars }, { data: stats }] = await Promise.all([
      supabase.from("provider_categories").select("category").eq("user_id", params.id),
      supabase.from("provider_areas").select("area").eq("user_id", params.id),
      supabase
        .from("provider_review_stats")
        .select("avg_rating, review_count")
        .eq("provider_id", params.id)
        .maybeSingle(),
    ]);

    return {
      provider: profile,
      categories: (cats ?? []).map((c) => c.category),
      areas: (ars ?? []).map((a) => a.area),
      avgRating: stats?.avg_rating ? Number(stats.avg_rating) : null,
      reviewCount: stats?.review_count ?? 0,
    };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.provider;
    if (!p) return { meta: [{ title: "Provider — Shebabd" }] };
    return {
      meta: [
        { title: `${p.full_name} — verified pro on Shebabd` },
        { name: "description", content: `Book ${p.full_name}, a verified professional on Shebabd.` },
        { property: "og:title", content: `${p.full_name} on Shebabd` },
        { property: "og:description", content: `Book ${p.full_name}, a verified professional on Shebabd.` },
      ],
    };
  },
  notFoundComponent: () => (
    <SiteShell>
      <div className="container-page py-24 text-center">
        <h1 className="text-3xl font-bold">Provider not found</h1>
        <Link to="/providers" className="mt-4 inline-block text-primary underline">
          Browse providers
        </Link>
      </div>
    </SiteShell>
  ),
  component: RealProviderProfile,
});

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_id: string;
};

function RealProviderProfile() {
  const { provider, categories, areas, avgRating, reviewCount } = Route.useLoaderData();
  const { user } = useAuth();
  const router = useRouter();
  const { saved, working, toggle, signedIn } = useSavedProvider(provider.id);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewerNames, setReviewerNames] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("reviews")
        .select("id, rating, comment, created_at, user_id")
        .eq("provider_id", provider.id)
        .order("created_at", { ascending: false })
        .limit(20);
      const list = (data ?? []) as Review[];
      setReviews(list);
      if (list.length) {
        const ids = Array.from(new Set(list.map((r) => r.user_id)));
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", ids);
        const map: Record<string, string> = {};
        (profs ?? []).forEach((p) => {
          map[p.id] = p.full_name || "Customer";
        });
        setReviewerNames(map);
      }
    })();
  }, [provider.id]);

  const initials = (provider.full_name || "?")
    .split(" ")
    .map((s: string) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const categoryNames = (categories as string[]).map(
    (slug: string) => ALL_CATEGORIES.find((c) => c.slug === slug)?.name ?? slug,
  );
  const areaNames = (areas as string[]).map(
    (slug: string) => ALL_AREAS.find((a) => a.slug === slug)?.name ?? slug,
  );

  return (
    <SiteShell>
      <section className="border-b border-border bg-gradient-subtle">
        <div className="container-page py-14">
          <Link
            to="/providers"
            className="text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            ← All providers
          </Link>

          <div className="mt-6 grid gap-8 md:grid-cols-[auto_1fr_auto] md:items-center">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl bg-gradient-primary text-3xl font-bold text-primary-foreground shadow-glow">
              {provider.avatar_url ? (
                <img
                  src={provider.avatar_url}
                  alt={provider.full_name}
                  className="h-full w-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                  {provider.full_name}
                </h1>
                <BadgeCheck className="h-6 w-6 text-primary" aria-label="Verified" />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {categoryNames.join(", ") || "Verified professional"}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Star className="h-4 w-4 fill-warning text-warning" />
                  <span className="font-semibold text-foreground">
                    {avgRating !== null ? avgRating.toFixed(1) : "New"}
                  </span>{" "}
                  · {reviewCount} review{reviewCount === 1 ? "" : "s"}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2 md:items-end">
              <Link
                to="/book"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft"
              >
                Book this provider <ArrowRight className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={() => {
                  if (!signedIn) {
                    router.navigate({ to: "/login" });
                    return;
                  }
                  toggle();
                }}
                disabled={working}
                className={`inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  saved
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-foreground hover:bg-muted"
                }`}
                aria-pressed={saved}
              >
                <Heart className={`h-4 w-4 ${saved ? "fill-primary" : ""}`} />
                {saved ? "Saved" : "Save"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Coverage areas</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {areaNames.length === 0 ? (
                <p className="text-sm text-muted-foreground">No areas set yet.</p>
              ) : (
                areaNames.map((n: string) => (
                  <span
                    key={n}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground"
                  >
                    <MapPin className="h-3.5 w-3.5 text-primary" /> {n}
                  </span>
                ))
              )}
            </div>

            <h2 className="mt-10 text-xl font-semibold text-foreground">Reviews</h2>
            <ReviewSection
              providerId={provider.id}
              reviews={reviews}
              reviewerNames={reviewerNames}
              onAdded={(r) => setReviews((rs) => [r, ...rs])}
              currentUserId={user?.id ?? null}
            />
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-elevated">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Verified pro
              </p>
              <p className="mt-1 text-base font-semibold text-foreground">
                {provider.full_name}
              </p>
              <Link
                to="/book"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft"
              >
                Book now <ArrowRight className="h-4 w-4" />
              </Link>
              {areaNames.length > 0 && (
                <p className="mt-4 text-xs text-muted-foreground">
                  Serves: {areaNames.join(", ")}
                </p>
              )}
            </div>
          </aside>
        </div>
      </section>
    </SiteShell>
  );
}

function ReviewSection({
  providerId,
  reviews,
  reviewerNames,
  onAdded,
  currentUserId,
}: {
  providerId: string;
  reviews: Review[];
  reviewerNames: Record<string, string>;
  onAdded: (r: Review) => void;
  currentUserId: string | null;
}) {
  const [eligibleBookingId, setEligibleBookingId] = useState<string | null>(null);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!currentUserId) return;
    (async () => {
      // Find a completed booking with this provider that hasn't been reviewed yet
      const { data: bookings } = await supabase
        .from("bookings")
        .select("id")
        .eq("user_id", currentUserId)
        .eq("provider_id", providerId)
        .eq("status", "completed")
        .order("created_at", { ascending: false });
      const ids = (bookings ?? []).map((b) => b.id);
      if (ids.length === 0) return;
      const { data: existing } = await supabase
        .from("reviews")
        .select("booking_id")
        .in("booking_id", ids);
      const reviewed = new Set((existing ?? []).map((r) => r.booking_id));
      const unreviewed = ids.find((id) => !reviewed.has(id));
      if (unreviewed) setEligibleBookingId(unreviewed);
      else setAlreadyReviewed(true);
    })();
  }, [currentUserId, providerId]);

  async function submitReview(e: FormEvent) {
    e.preventDefault();
    if (!currentUserId || !eligibleBookingId) return;
    setSubmitting(true);
    const { data, error } = await supabase
      .from("reviews")
      .insert({
        booking_id: eligibleBookingId,
        provider_id: providerId,
        user_id: currentUserId,
        rating,
        comment: comment.trim() || null,
      })
      .select("id, rating, comment, created_at, user_id")
      .single();
    setSubmitting(false);
    if (error || !data) {
      toast.error("Could not post review", { description: error?.message });
      return;
    }
    toast.success("Review posted — thanks!");
    onAdded(data as Review);
    setEligibleBookingId(null);
    setAlreadyReviewed(true);
    setComment("");
  }

  return (
    <div className="mt-4 space-y-6">
      {currentUserId && eligibleBookingId && (
        <form
          onSubmit={submitReview}
          className="rounded-2xl border border-primary/30 bg-primary/5 p-5"
        >
          <p className="text-sm font-semibold text-foreground">
            How was your service?
          </p>
          <div className="mt-3 flex items-center gap-3">
            <StarRating value={rating} onChange={setRating} size="lg" />
            <span className="text-sm text-muted-foreground">{rating}/5</span>
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share details about your experience (optional)"
            maxLength={500}
            rows={3}
            className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Post review
            </button>
          </div>
        </form>
      )}

      {currentUserId && !eligibleBookingId && alreadyReviewed && (
        <p className="text-xs text-muted-foreground">
          You've already reviewed this provider. Thanks for sharing!
        </p>
      )}

      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No reviews yet. Be the first after your next service.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-2xl border border-border bg-card p-5">
              <StarRating value={r.rating} readOnly size="sm" />
              {r.comment && (
                <p className="mt-2 text-sm text-card-foreground">&ldquo;{r.comment}&rdquo;</p>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                — {reviewerNames[r.user_id] ?? "Customer"} ·{" "}
                {new Date(r.created_at).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
