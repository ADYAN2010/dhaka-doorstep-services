import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search, MapPin, Tag, Clock, Star, ArrowRight, SlidersHorizontal, X } from "lucide-react";
import { categories, type Category, type Service, type Subcategory } from "@/data/categories";
import { areas } from "@/data/areas";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type FlatService = {
  service: Service;
  subcategory: Subcategory;
  category: Category;
  rating: number;
  reviews: number;
  areaCount: number;
};

// Deterministic pseudo-rating so SSR/CSR match
function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return Math.abs(h);
}

function buildIndex(): FlatService[] {
  const list: FlatService[] = [];
  for (const c of categories) {
    for (const sub of c.subcategories) {
      for (const s of sub.services) {
        const h = hash(c.slug + s.slug);
        list.push({
          service: s,
          subcategory: sub,
          category: c,
          rating: 4.4 + ((h % 60) / 100), // 4.40 – 4.99
          reviews: 18 + (h % 240),
          areaCount: 4 + (h % (areas.length - 3)),
        });
      }
    }
  }
  return list;
}

type Sort = "popular" | "price-asc" | "price-desc" | "rating" | "name";

type Props = {
  initialCategory?: string;
  lockCategory?: boolean; // hide category dropdown on category pages
  loading?: boolean;
};

export function ServiceCatalog({ initialCategory = "all", lockCategory = false, loading = false }: Props) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>(initialCategory);
  const [sub, setSub] = useState<string>("all");
  const [area, setArea] = useState<string>("all");
  const [priceTier, setPriceTier] = useState<string>("all");
  const [sort, setSort] = useState<Sort>("popular");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const all = useMemo(buildIndex, []);

  const subcategories = useMemo(() => {
    if (cat === "all") return [];
    const c = categories.find((x) => x.slug === cat);
    return c?.subcategories ?? [];
  }, [cat]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let res = all.filter((f) => {
      if (cat !== "all" && f.category.slug !== cat) return false;
      if (sub !== "all" && f.subcategory.slug !== sub) return false;
      if (priceTier !== "all") {
        const p = f.service.startingPrice;
        if (priceTier === "lt1k" && p >= 1000) return false;
        if (priceTier === "1to3k" && (p < 1000 || p > 3000)) return false;
        if (priceTier === "3to10k" && (p < 3000 || p > 10000)) return false;
        if (priceTier === "gt10k" && p <= 10000) return false;
      }
      if (area !== "all") {
        // pseudo-coverage: include service if area index < areaCount
        const idx = areas.findIndex((a) => a.slug === area);
        if (idx >= f.areaCount) return false;
      }
      if (needle) {
        const hay = `${f.service.name} ${f.service.short} ${f.category.name} ${f.subcategory.name}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });

    res = [...res].sort((a, b) => {
      switch (sort) {
        case "price-asc": return a.service.startingPrice - b.service.startingPrice;
        case "price-desc": return b.service.startingPrice - a.service.startingPrice;
        case "rating": return b.rating - a.rating;
        case "name": return a.service.name.localeCompare(b.service.name);
        default: return b.reviews - a.reviews; // popular = most-reviewed
      }
    });
    return res;
  }, [all, q, cat, sub, area, priceTier, sort]);

  const reset = () => {
    setQ("");
    if (!lockCategory) setCat("all");
    setSub("all");
    setArea("all");
    setPriceTier("all");
    setSort("popular");
  };

  const activeFilters =
    (q ? 1 : 0) +
    (!lockCategory && cat !== "all" ? 1 : 0) +
    (sub !== "all" ? 1 : 0) +
    (area !== "all" ? 1 : 0) +
    (priceTier !== "all" ? 1 : 0);

  return (
    <div className="container-page py-8 md:py-12">
      {/* Search + sort bar */}
      <div className="rounded-2xl border border-border bg-card p-3 shadow-soft md:p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-xl bg-background px-3 py-2.5">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search services, e.g. AC service, deep cleaning, web design"
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              aria-label="Search services"
            />
            {q && (
              <button onClick={() => setQ("")} className="text-muted-foreground hover:text-foreground" aria-label="Clear search">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
              <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Sort by" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Most popular</SelectItem>
                <SelectItem value="rating">Highest rated</SelectItem>
                <SelectItem value="price-asc">Price: low to high</SelectItem>
                <SelectItem value="price-desc">Price: high to low</SelectItem>
                <SelectItem value="name">Name (A–Z)</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="default"
              onClick={() => setFiltersOpen((v) => !v)}
              className="md:hidden"
              aria-expanded={filtersOpen}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters {activeFilters > 0 && <span className="ml-1 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">{activeFilters}</span>}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className={cn("mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4", !filtersOpen && "hidden md:grid")}>
          {!lockCategory && (
            <Select value={cat} onValueChange={(v) => { setCat(v); setSub("all"); }}>
              <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((c) => <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Select value={sub} onValueChange={setSub} disabled={cat === "all" || subcategories.length === 0}>
            <SelectTrigger><SelectValue placeholder={cat === "all" ? "Pick a category first" : "Subcategory"} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All subcategories</SelectItem>
              {subcategories.map((s) => <SelectItem key={s.slug} value={s.slug}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={area} onValueChange={setArea}>
            <SelectTrigger><SelectValue placeholder="Area" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All areas in Dhaka</SelectItem>
              {areas.map((a) => <SelectItem key={a.slug} value={a.slug}>{a.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={priceTier} onValueChange={setPriceTier}>
            <SelectTrigger><SelectValue placeholder="Price" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any price</SelectItem>
              <SelectItem value="lt1k">Under ৳1,000</SelectItem>
              <SelectItem value="1to3k">৳1,000 – ৳3,000</SelectItem>
              <SelectItem value="3to10k">৳3,000 – ৳10,000</SelectItem>
              <SelectItem value="gt10k">Over ৳10,000</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {activeFilters > 0 && (
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>{filtered.length} {filtered.length === 1 ? "service" : "services"} match</span>
            <button onClick={reset} className="font-semibold text-primary hover:underline">Reset filters</button>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="mt-6">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-3 h-5 w-3/4" />
                <Skeleton className="mt-2 h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-2/3" />
                <Skeleton className="mt-4 h-9 w-full" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState onReset={reset} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((f) => <ServiceCard key={`${f.category.slug}-${f.service.slug}`} item={f} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function ServiceCard({ item }: { item: FlatService }) {
  const { service, category, subcategory, rating, reviews, areaCount } = item;
  const Icon = category.icon;
  return (
    <article className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevated">
      <div className="flex items-center gap-2">
        <span className={cn("inline-flex h-8 w-8 items-center justify-center rounded-lg", category.accent)}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-muted-foreground">{category.name} · {subcategory.name}</p>
        </div>
      </div>

      <h3 className="mt-3 text-base font-semibold text-card-foreground">{service.name}</h3>
      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{service.short}</p>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /><span className="font-semibold text-foreground">{rating.toFixed(1)}</span> ({reviews})</span>
        <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-primary" /> {areaCount}+ areas</span>
        {service.duration && <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {service.duration}</span>}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <div className="text-sm">
          <span className="inline-flex items-center gap-1 text-muted-foreground"><Tag className="h-3.5 w-3.5 text-primary" /> <span className="font-bold text-foreground">৳{service.startingPrice.toLocaleString()}</span></span>
          {service.unit && <span className="ml-1 text-xs text-muted-foreground">{service.unit}</span>}
        </div>
        <Link
          to="/services/$category/$service"
          params={{ category: category.slug, service: service.slug }}
          className="inline-flex items-center gap-1 rounded-lg bg-gradient-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-soft transition-transform group-hover:translate-x-0.5"
        >
          Book now <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Search className="h-5 w-5 text-muted-foreground" />
      </div>
      <h3 className="mt-3 text-lg font-semibold text-foreground">No services match your filters</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">Try removing a filter, choosing a different area, or searching with a broader keyword.</p>
      <div className="mt-4 flex gap-2">
        <Button onClick={onReset} variant="outline">Reset filters</Button>
        <Link to="/contact" className="inline-flex items-center rounded-md bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft">Request a custom quote</Link>
      </div>
    </div>
  );
}
