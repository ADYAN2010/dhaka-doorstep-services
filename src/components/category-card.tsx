import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { Category } from "@/data/categories";

export function CategoryCard({ category }: { category: Category }) {
  const Icon = category.icon;
  return (
    <Link
      to="/services/$category"
      params={{ category: category.slug }}
      className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevated"
    >
      <span
        className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${category.accent}`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="flex-1">
        <h3 className="text-base font-semibold text-card-foreground">{category.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{category.tagline}</p>
      </div>
      <span className="inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
        Explore <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </Link>
  );
}
