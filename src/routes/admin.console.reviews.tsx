import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Star, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/page-header";
import { SectionCard } from "@/components/admin/primitives";
import { EmptyState, ErrorState } from "@/components/admin/empty-state";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/console/reviews")({
  component: ReviewsPage,
});

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_id: string;
  provider_id: string;
  booking_id: string;
};
type Profile = { id: string; full_name: string };

function ReviewsPage() {
  const [rows, setRows] = useState<Review[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("reviews")
      .select("id, rating, comment, created_at, user_id, provider_id, booking_id")
      .order("created_at", { ascending: false });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    const reviews = (data ?? []) as Review[];
    setRows(reviews);
    const ids = Array.from(new Set(reviews.flatMap((r) => [r.user_id, r.provider_id])));
    if (ids.length > 0) {
      const { data: p } = await supabase.from("profiles").select("id, full_name").in("id", ids);
      const map: Record<string, string> = {};
      (p as Profile[] | null)?.forEach((x) => { map[x.id] = x.full_name || "—"; });
      setProfiles(map);
    }
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  async function remove(id: string) {
    if (!confirm("Delete this review?")) return;
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((rs) => rs.filter((r) => r.id !== id));
    toast.success("Review deleted");
  }

  return (
    <div>
      <AdminPageHeader
        eyebrow="Marketplace"
        title="Reviews"
        description="Moderate customer reviews submitted after completed bookings."
        breadcrumbs={[{ label: "Admin", to: "/admin/console" }, { label: "Reviews" }]}
      />
      <SectionCard padded={false}>
        {loading ? (
          <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : error ? (
          <div className="p-5"><ErrorState description={error} /></div>
        ) : rows.length === 0 ? (
          <div className="p-5"><EmptyState icon={Star} title="No reviews yet" description="When customers leave reviews on completed jobs they appear here." /></div>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((r) => (
              <li key={r.id} className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{profiles[r.user_id] ?? "Customer"}</span>
                      {" → "}
                      <span className="font-medium text-foreground">{profiles[r.provider_id] ?? "Provider"}</span>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => remove(r.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
                {r.comment && <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">{r.comment}</p>}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
