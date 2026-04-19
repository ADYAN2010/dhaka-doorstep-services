import { useEffect, useState } from "react";
import { Loader2, MapPin, Pin, PinOff, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { marketingService, type FeaturedProvider } from "@/services/marketing";

export function FeaturedProviders() {
  const [items, setItems] = useState<FeaturedProvider[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setItems(await marketingService.listFeatured());
    setLoading(false);
  }
  useEffect(() => {
    void load();
  }, []);

  async function pin(id: string) {
    await marketingService.togglePinned(id);
    toast.success("Pin updated");
    void load();
  }
  async function remove(id: string) {
    if (!confirm("Remove this provider from the featured list?")) return;
    await marketingService.removeFeatured(id);
    toast.success("Removed from featured");
    void load();
  }

  if (loading) {
    return (
      <div className="grid place-items-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Homepage spotlight
          </div>
          <div className="text-base font-semibold">Featured providers</div>
        </div>
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
          {items.length} active
        </span>
      </div>
      <ul className="divide-y divide-border">
        {items.map((p) => (
          <li key={p.id} className="flex items-center gap-3 px-5 py-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={p.avatarUrl} />
              <AvatarFallback>{p.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-medium">{p.name}</span>
                {p.pinned && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:text-amber-300">
                    <Pin className="h-2.5 w-2.5" /> Pinned
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="rounded-md bg-muted px-1.5 py-0.5 font-medium">{p.category}</span>
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3 w-3 text-amber-500" />
                  {p.rating} · {p.jobs} jobs
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {p.area}
                </span>
                {p.endsAt && (
                  <span>
                    Ends {new Date(p.endsAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => pin(p.id)}>
              {p.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
              {p.pinned ? "Unpin" : "Pin"}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-destructive hover:bg-destructive/10"
              onClick={() => remove(p.id)}
              aria-label="Remove"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
