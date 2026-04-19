import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * `/en/<anything>` — sets the English preference (via cookie hint) and
 * redirects to the unprefixed path. The actual language switch happens in
 * `I18nProvider` which sees the `/en` prefix in the pathname before the
 * redirect runs on the client. We persist the choice in localStorage so the
 * user keeps English on subsequent visits.
 *
 * Why a redirect instead of duplicating routes? Building separately rendered
 * routes for both languages would mean cloning every route file. Persisted
 * locale + a single set of routes gives us bilingual UX with zero code
 * duplication. The trade-off is that English isn't independently indexable,
 * which is acceptable for a Bangla-first product.
 */
export const Route = createFileRoute("/en/$")({
  beforeLoad: ({ params }) => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem("shebabd-language", "en");
      } catch {
        // storage may be blocked
      }
    }
    const splat = (params as { _splat?: string })._splat ?? "";
    throw redirect({ to: `/${splat}` as never, replace: true });
  },
  component: () => null,
});
