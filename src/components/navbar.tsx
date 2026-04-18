import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, Menu, X, ChevronDown } from "lucide-react";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

const NAV = [
  { to: "/services", label: "Services" },
  { to: "/providers", label: "Providers" },
  { to: "/areas", label: "Areas" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/about", label: "About" },
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container-page flex h-16 items-center gap-4">
        <Link to="/" className="shrink-0">
          <Logo />
        </Link>

        <nav className="ml-6 hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{ className: "rounded-full px-3 py-2 text-sm font-medium bg-muted text-foreground" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            className="hidden items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted lg:inline-flex"
          >
            <MapPin className="h-3.5 w-3.5 text-primary" />
            Dhaka
            <ChevronDown className="h-3.5 w-3.5 opacity-60" />
          </button>

          <ThemeToggle />

          <Link
            to="/become-provider"
            className="hidden rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted md:inline-flex"
          >
            Join as Provider
          </Link>
          <Link
            to="/book"
            className="hidden rounded-full bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.02] md:inline-flex"
          >
            Book a Service
          </Link>

          <button
            type="button"
            aria-label="Open menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border md:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="container-page flex flex-col gap-1 py-4">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-base font-medium text-foreground hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              <Link
                to="/become-provider"
                onClick={() => setOpen(false)}
                className="rounded-full border border-border px-4 py-2 text-center text-sm font-medium"
              >
                Join as Provider
              </Link>
              <Link
                to="/book"
                onClick={() => setOpen(false)}
                className="rounded-full bg-gradient-primary px-4 py-2 text-center text-sm font-semibold text-primary-foreground"
              >
                Book a Service
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
