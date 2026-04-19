/**
 * LeaveReviewForm — signed-in customers can post / update their review for a
 * provider. Calls `reviewsApi.upsert` and asks the parent route to reload its
 * loader data so the review list + rating breakdown refresh in place.
 *
 * Auth gating:
 *  - While `useBackendAuth()` is loading → show a small skeleton.
 *  - Not signed in → show a "Sign in to leave a review" CTA pointing to /login
 *    with a redirect back to this page.
 *  - Signed in but not a customer → friendly note (admins/providers can't review).
 */
import { Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, LogIn, Send } from "lucide-react";
import { toast } from "sonner";
import { useBackendAuth } from "@/components/backend-auth-provider";
import { reviewsApi } from "@/lib/providers-api";
import { ApiError } from "@/lib/api-client";
import { StarRating } from "@/components/star-rating";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type Props = {
  providerId: string;
  /** Path to come back to after sign-in (e.g. `/p/${id}`). */
  returnTo: string;
};

export function LeaveReviewForm({ providerId, returnTo }: Props) {
  const router = useRouter();
  const { user, loading: authLoading } = useBackendAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (authLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Checking sign-in…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-start gap-2">
        <p className="text-sm text-muted-foreground">
          Sign in as a customer to leave a review.
        </p>
        <Link
          to="/login"
          search={{ redirect: returnTo } as never}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.01]"
        >
          <LogIn className="h-4 w-4" /> Sign in to review
        </Link>
      </div>
    );
  }

  if (user.role !== "customer") {
    return (
      <p className="text-sm text-muted-foreground">
        Only customer accounts can leave reviews.
      </p>
    );
  }

  const trimmed = comment.trim();
  const canSubmit = rating >= 1 && rating <= 5 && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) {
      if (rating < 1) toast.error("Please pick a star rating before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      await reviewsApi.upsert({
        provider_id: providerId,
        rating: rating as 1 | 2 | 3 | 4 | 5,
        comment: trimmed.length > 0 ? trimmed.slice(0, 2000) : undefined,
      });
      toast.success("Thanks for the review!");
      setComment("");
      // Refresh loader data so the review list + averages update in place.
      await router.invalidate();
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Failed to submit review";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <div className="mb-1.5 text-xs font-medium text-muted-foreground">Your rating</div>
        <StarRating value={rating} onChange={setRating} size="lg" />
      </div>

      <div>
        <label
          htmlFor="leave-review-comment"
          className="mb-1.5 block text-xs font-medium text-muted-foreground"
        >
          Your review (optional)
        </label>
        <Textarea
          id="leave-review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, 2000))}
          placeholder="Share what worked well, response time, quality of work…"
          rows={4}
          maxLength={2000}
        />
        <div className="mt-1 text-right text-[10px] text-muted-foreground">
          {comment.length}/2000
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={!canSubmit}>
          {submitting ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-1.5 h-4 w-4" />
          )}
          {submitting ? "Submitting…" : "Submit review"}
        </Button>
        <span className="text-xs text-muted-foreground">
          You can update your review anytime — only one per provider.
        </span>
      </div>
    </form>
  );
}
