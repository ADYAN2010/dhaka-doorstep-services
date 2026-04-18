import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Check, MapPin, Tags } from "lucide-react";
import { toast } from "sonner";
import { SiteShell } from "@/components/site-shell";
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/integrations/supabase/client";
import { categories } from "@/data/categories";
import { areas } from "@/data/areas";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/coverage")({
  head: () => ({
    meta: [
      { title: "Service coverage · Shebabd" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CoveragePage,
});

type ProviderStatus = "not_applicable" | "pending" | "approved" | "rejected";

function CoveragePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<ProviderStatus>("not_applicable");
  const [selectedCats, setSelectedCats] = useState<Set<string>>(new Set());
  const [selectedAreas, setSelectedAreas] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: prof }, { data: cats }, { data: ars }] = await Promise.all([
        supabase.from("profiles").select("provider_status").eq("id", user.id).maybeSingle(),
        supabase.from("provider_categories").select("category").eq("user_id", user.id),
        supabase.from("provider_areas").select("area").eq("user_id", user.id),
      ]);
      setStatus((prof?.provider_status as ProviderStatus) ?? "not_applicable");
      setSelectedCats(new Set((cats ?? []).map((c) => c.category)));
      setSelectedAreas(new Set((ars ?? []).map((a) => a.area)));
      setLoading(false);
    })();
  }, [user]);

  function toggle(set: Set<string>, key: string, setter: (s: Set<string>) => void) {
    const next = new Set(set);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setter(next);
  }

  async function save() {
    if (!user) return;
    if (status !== "approved") {
      toast.error("Coverage can only be saved once your provider application is approved.");
      return;
    }
    setSaving(true);

    // Reconcile categories
    const { data: currentCats } = await supabase
      .from("provider_categories")
      .select("category")
      .eq("user_id", user.id);
    const currentCatSet = new Set((currentCats ?? []).map((c) => c.category));
    const catsToAdd = [...selectedCats].filter((c) => !currentCatSet.has(c));
    const catsToRemove = [...currentCatSet].filter((c) => !selectedCats.has(c));

    // Reconcile areas
    const { data: currentAreas } = await supabase
      .from("provider_areas")
      .select("area")
      .eq("user_id", user.id);
    const currentAreaSet = new Set((currentAreas ?? []).map((a) => a.area));
    const areasToAdd = [...selectedAreas].filter((a) => !currentAreaSet.has(a));
    const areasToRemove = [...currentAreaSet].filter((a) => !selectedAreas.has(a));

    const ops: Promise<{ error: unknown }>[] = [];
    if (catsToAdd.length) {
      ops.push(
        supabase
          .from("provider_categories")
          .insert(catsToAdd.map((category) => ({ user_id: user.id, category }))),
      );
    }
    if (catsToRemove.length) {
      ops.push(
        supabase
          .from("provider_categories")
          .delete()
          .eq("user_id", user.id)
          .in("category", catsToRemove),
      );
    }
    if (areasToAdd.length) {
      ops.push(
        supabase
          .from("provider_areas")
          .insert(areasToAdd.map((area) => ({ user_id: user.id, area }))),
      );
    }
    if (areasToRemove.length) {
      ops.push(
        supabase
          .from("provider_areas")
          .delete()
          .eq("user_id", user.id)
          .in("area", areasToRemove),
      );
    }

    const results = await Promise.all(ops);
    setSaving(false);
    const firstError = results.find((r) => r.error);
    if (firstError) {
      toast.error("Could not save coverage", {
        description: (firstError.error as { message?: string })?.message,
      });
      return;
    }
    toast.success("Coverage updated");
  }

  if (loading) {
    return (
      <SiteShell>
        <div className="container-page flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <PageHeader
        eyebrow="Provider"
        title="Service coverage"
        description="Pick the categories you offer and the Dhaka areas you serve. We only show leads that match."
      />
      <section className="container-page pb-16">
        {status !== "approved" && (
          <div className="mx-auto mb-6 max-w-3xl rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-200">
            Your provider account is{" "}
            <span className="font-semibold">{status.replace("_", " ")}</span>. You can edit
            your selections, but coverage will only be saved once you're approved.{" "}
            {status === "not_applicable" && (
              <Link to="/become-provider" className="underline">
                Apply to become a provider
              </Link>
            )}
          </div>
        )}

        <div className="mx-auto grid max-w-3xl gap-6">
          {/* Categories */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center gap-2">
              <Tags className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-semibold text-card-foreground">Categories</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose every category you can take jobs in.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {categories.map((c) => {
                const on = selectedCats.has(c.slug);
                return (
                  <button
                    key={c.slug}
                    type="button"
                    onClick={() => toggle(selectedCats, c.slug, setSelectedCats)}
                    className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
                      on
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-background text-foreground hover:bg-muted"
                    }`}
                  >
                    <span className="truncate">{c.name}</span>
                    {on && <Check className="h-4 w-4 shrink-0 text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Areas */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-semibold text-card-foreground">Service areas</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Pick every Dhaka area you're willing to travel to.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {areas.map((a) => {
                const on = selectedAreas.has(a.slug);
                return (
                  <button
                    key={a.slug}
                    type="button"
                    onClick={() => toggle(selectedAreas, a.slug, setSelectedAreas)}
                    className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
                      on
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-background text-foreground hover:bg-muted"
                    }`}
                  >
                    <span className="truncate">{a.name}</span>
                    {on && <Check className="h-4 w-4 shrink-0 text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <p className="text-xs text-muted-foreground">
              {selectedCats.size} categor{selectedCats.size === 1 ? "y" : "ies"} ·{" "}
              {selectedAreas.size} area{selectedAreas.size === 1 ? "" : "s"}
            </p>
            <Button onClick={save} disabled={saving || status !== "approved"}>
              {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Save coverage
            </Button>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
