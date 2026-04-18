import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, ArrowRight } from "lucide-react";
import { categories } from "@/data/categories";

type Suggestion = { label: string; sub: string; to: string; params: Record<string, string> };

export function HeroSearch() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const all = useMemo<Suggestion[]>(() => {
    const list: Suggestion[] = [];
    for (const c of categories) {
      list.push({ label: c.name, sub: "Category", to: "/services/$category", params: { category: c.slug } });
      for (const sub of c.subcategories) {
        for (const s of sub.services) {
          list.push({
            label: s.name,
            sub: c.name,
            to: "/services/$category/$service",
            params: { category: c.slug, service: s.slug },
          });
        }
      }
    }
    return list;
  }, []);

  const matches = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return all.slice(0, 6);
    return all.filter((s) => s.label.toLowerCase().includes(needle)).slice(0, 8);
  }, [q, all]);

  return (
    <div className="relative w-full">
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-elevated">
        <div className="flex flex-1 items-center gap-2 rounded-xl bg-background px-3 py-2.5">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder="What service do you need? e.g. AC service, cleaning, electrician"
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            aria-label="Search services"
          />
        </div>
        <Link
          to="/services"
          className="hidden items-center gap-1.5 rounded-xl bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft sm:inline-flex"
        >
          Search <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {open && matches.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-border bg-popover shadow-elevated">
          <ul className="max-h-80 overflow-y-auto">
            {matches.map((m) => (
              <li key={`${m.to}-${m.label}-${m.sub}`}>
                <Link
                  // @ts-expect-error dynamic params route
                  to={m.to}
                  // @ts-expect-error dynamic params route
                  params={m.params}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted"
                >
                  <span>
                    <span className="block text-sm font-medium text-popover-foreground">{m.label}</span>
                    <span className="block text-xs text-muted-foreground">{m.sub}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
