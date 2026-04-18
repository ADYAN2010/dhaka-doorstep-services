/**
 * Central SEO utilities.
 * SITE_URL must be the canonical production URL (no trailing slash).
 */
export const SITE_URL = "https://shebabd.com";

import ogHome from "@/assets/og-home.jpg";
import ogServices from "@/assets/og-services.jpg";
import ogProviders from "@/assets/og-providers.jpg";
import ogAreas from "@/assets/og-areas.jpg";
import ogBecomeProvider from "@/assets/og-become-provider.jpg";
import ogContact from "@/assets/og-contact.jpg";

export const OG = {
  home: ogHome,
  services: ogServices,
  providers: ogProviders,
  areas: ogAreas,
  becomeProvider: ogBecomeProvider,
  contact: ogContact,
};

export function absUrl(path: string) {
  if (!path) return SITE_URL;
  if (path.startsWith("http")) return path;
  return `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

type SeoInput = {
  title: string;
  description: string;
  canonical: string; // path like "/about" — will be made absolute
  image?: string; // imported asset URL or absolute URL
  type?: "website" | "article" | "profile";
  noindex?: boolean;
};

/**
 * Build a tanstack-router head() meta + links array with the standard SEO set.
 * Use spread: head: () => ({ ...buildSeo({...}) })
 */
export function buildSeo(input: SeoInput) {
  const url = absUrl(input.canonical);
  const image = input.image ? absUrl(input.image) : undefined;

  const meta: Array<Record<string, string>> = [
    { title: input.title },
    { name: "description", content: input.description },
    { property: "og:title", content: input.title },
    { property: "og:description", content: input.description },
    { property: "og:type", content: input.type ?? "website" },
    { property: "og:url", content: url },
    { property: "og:site_name", content: "Shebabd" },
    { name: "twitter:card", content: image ? "summary_large_image" : "summary" },
    { name: "twitter:title", content: input.title },
    { name: "twitter:description", content: input.description },
  ];

  if (image) {
    meta.push({ property: "og:image", content: image });
    meta.push({ property: "og:image:width", content: "1200" });
    meta.push({ property: "og:image:height", content: "630" });
    meta.push({ name: "twitter:image", content: image });
  }

  if (input.noindex) {
    meta.push({ name: "robots", content: "noindex, nofollow" });
  }

  return {
    meta,
    links: [{ rel: "canonical", href: url }],
  };
}

/** JSON-LD script entry usable inside head().scripts. */
export function jsonLdScript(data: Record<string, unknown>) {
  return {
    type: "application/ld+json",
    children: JSON.stringify(data),
  };
}

export const ORGANIZATION_LD = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${SITE_URL}/#organization`,
  name: "Shebabd",
  url: SITE_URL,
  logo: `${SITE_URL}/favicon.ico`,
  image: absUrl(ogHome),
  description:
    "Bangladesh's all-in-one service platform. Book verified professionals in Dhaka for home, personal, business and technical services.",
  areaServed: { "@type": "City", name: "Dhaka" },
  address: {
    "@type": "PostalAddress",
    addressLocality: "Dhaka",
    addressCountry: "BD",
  },
  priceRange: "৳",
  sameAs: [] as string[],
};
