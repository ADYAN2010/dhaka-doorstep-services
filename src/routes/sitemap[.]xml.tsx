import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { areas } from "@/data/areas";
import { categories } from "@/data/categories";

const SITE_URL = "https://shebabd.com";

// Static marketing routes — change priority/changefreq if needed.
const STATIC_ROUTES: Array<{ path: string; priority: number; changefreq: string }> = [
  { path: "/", priority: 1.0, changefreq: "weekly" },
  { path: "/services", priority: 0.9, changefreq: "weekly" },
  { path: "/providers", priority: 0.8, changefreq: "daily" },
  { path: "/areas", priority: 0.8, changefreq: "monthly" },
  { path: "/become-provider", priority: 0.7, changefreq: "monthly" },
  { path: "/how-it-works", priority: 0.6, changefreq: "monthly" },
  { path: "/pricing", priority: 0.7, changefreq: "weekly" },
  { path: "/about", priority: 0.5, changefreq: "monthly" },
  { path: "/contact", priority: 0.6, changefreq: "monthly" },
  { path: "/faq", priority: 0.5, changefreq: "monthly" },
  { path: "/trust-safety", priority: 0.5, changefreq: "monthly" },
  { path: "/blog", priority: 0.7, changefreq: "weekly" },
  { path: "/privacy", priority: 0.2, changefreq: "yearly" },
  { path: "/terms", priority: 0.2, changefreq: "yearly" },
];

function urlEntry(loc: string, lastmod?: string, changefreq?: string, priority?: number) {
  return [
    "  <url>",
    `    <loc>${SITE_URL}${loc}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : "",
    changefreq ? `    <changefreq>${changefreq}</changefreq>` : "",
    priority !== undefined ? `    <priority>${priority.toFixed(1)}</priority>` : "",
    "  </url>",
  ]
    .filter(Boolean)
    .join("\n");
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const today = new Date().toISOString().split("T")[0];
        const urls: string[] = [];

        // 1. Static marketing pages
        for (const r of STATIC_ROUTES) {
          urls.push(urlEntry(r.path, today, r.changefreq, r.priority));
        }

        // 2. Area landing pages (static data)
        for (const a of areas) {
          urls.push(urlEntry(`/dhaka/${a.slug}`, today, "monthly", 0.7));
        }

        // 3. Service category pages (static data)
        for (const c of categories) {
          urls.push(urlEntry(`/services/${c.slug}`, today, "weekly", 0.7));
          // Individual service pages
          for (const sub of c.subcategories) {
            for (const s of sub.services) {
              urls.push(urlEntry(`/services/${c.slug}/${s.slug}`, today, "monthly", 0.5));
            }
          }
        }

        // 4. Dynamic — published blog posts from DB
        try {
          const supabaseUrl = process.env.VITE_SUPABASE_URL;
          const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
          if (supabaseUrl && supabaseKey) {
            const supabase = createClient(supabaseUrl, supabaseKey);
            const { data: posts } = await supabase
              .from("blog_posts")
              .select("slug, updated_at")
              .eq("published", true)
              .order("published_at", { ascending: false })
              .limit(1000);
            for (const p of posts ?? []) {
              const lastmod = p.updated_at
                ? new Date(p.updated_at).toISOString().split("T")[0]
                : today;
              urls.push(urlEntry(`/blog/${p.slug}`, lastmod, "monthly", 0.6));
            }
          }
        } catch (err) {
          console.error("Sitemap blog fetch failed:", err);
          // Continue — static URLs still serve.
        }

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600, s-maxage=3600",
          },
        });
      },
    },
  },
});
