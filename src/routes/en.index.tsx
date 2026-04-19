import { createFileRoute, redirect } from "@tanstack/react-router";

/** Bare `/en` — set English, then send to home. */
export const Route = createFileRoute("/en/")({
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem("shebabd-language", "en");
      } catch {
        // storage may be blocked
      }
    }
    throw redirect({ to: "/", replace: true });
  },
  component: () => null,
});
