import { Link } from "@tanstack/react-router";
import { Logo } from "./logo";
import { Facebook, Instagram, Linkedin, Mail, Phone } from "lucide-react";

const COL_SERVICES = [
  { to: "/services/home-cleaning", label: "Home Cleaning" },
  { to: "/services/ac-service", label: "AC Service" },
  { to: "/services/electrician", label: "Electrician" },
  { to: "/services/plumbing", label: "Plumbing" },
  { to: "/services/beauty-at-home", label: "Beauty at Home" },
  { to: "/services", label: "Browse all →" },
] as const;

const COL_COMPANY = [
  { to: "/about", label: "About Us" },
  { to: "/how-it-works", label: "How it Works" },
  { to: "/become-provider", label: "Become a Provider" },
  { to: "/contact", label: "Contact" },
  { to: "/blog", label: "Blog & Insights" },
] as const;

const COL_TRUST = [
  { to: "/trust-safety", label: "Trust & Safety" },
  { to: "/pricing", label: "Pricing & Charges" },
  { to: "/faq", label: "FAQ" },
  { to: "/terms", label: "Terms" },
  { to: "/privacy", label: "Privacy" },
] as const;

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-surface text-surface-foreground">
      <div className="container-page py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Bangladesh&apos;s all-in-one service platform. Verified professionals across Dhaka for
              home, personal, business and technical services.
            </p>
            <div className="mt-5 space-y-2 text-sm text-muted-foreground">
              <a href="tel:+8801700000000" className="flex items-center gap-2 hover:text-foreground">
                <Phone className="h-4 w-4 text-primary" /> +880 1700 000000
              </a>
              <a href="mailto:hello@shebabd.com" className="flex items-center gap-2 hover:text-foreground">
                <Mail className="h-4 w-4 text-primary" /> hello@shebabd.com
              </a>
            </div>
            <div className="mt-5 flex gap-2">
              {[Facebook, Instagram, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  aria-label="Social link"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <FooterCol title="Services" items={COL_SERVICES} />
          <FooterCol title="Company" items={COL_COMPANY} />
          <FooterCol title="Trust & Help" items={COL_TRUST} />
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Shebabd. All rights reserved. Made in Dhaka 🇧🇩</p>
          <p>Launching first in Dhaka. Coming soon: Chattogram, Sylhet, Rajshahi, Khulna.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  items,
}: {
  title: string;
  items: ReadonlyArray<{ to: string; label: string }>;
}) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <ul className="mt-4 space-y-2.5 text-sm">
        {items.map((it) => (
          <li key={it.to}>
            <Link to={it.to} className="text-muted-foreground transition-colors hover:text-foreground">
              {it.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
