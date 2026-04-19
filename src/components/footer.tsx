import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Logo } from "./logo";
import { PaymentsWall } from "./logo-wall";
import { Facebook, Instagram, Linkedin, Mail, Phone } from "lucide-react";

const COL_SERVICES = [
  { to: "/services/home-cleaning", labelBn: "ঘর পরিষ্কার", labelEn: "Home Cleaning" },
  { to: "/services/ac-service", labelBn: "এসি সার্ভিস", labelEn: "AC Service" },
  { to: "/services/electrician", labelBn: "ইলেকট্রিশিয়ান", labelEn: "Electrician" },
  { to: "/services/plumbing", labelBn: "প্লাম্বিং", labelEn: "Plumbing" },
  { to: "/services/beauty-at-home", labelBn: "বাসায় বিউটি সেবা", labelEn: "Beauty at Home" },
  { to: "/services", labelBn: "সব দেখুন →", labelEn: "Browse all →" },
] as const;

const COL_COMPANY = [
  { to: "/about", labelBn: "আমাদের সম্পর্কে", labelEn: "About Us" },
  { to: "/how-it-works", labelBn: "যেভাবে কাজ করে", labelEn: "How it Works" },
  { to: "/become-provider", labelBn: "প্রোভাইডার হোন", labelEn: "Become a Provider" },
  { to: "/contact", labelBn: "যোগাযোগ", labelEn: "Contact" },
  { to: "/blog", labelBn: "ব্লগ ও ইনসাইট", labelEn: "Blog & Insights" },
] as const;

const COL_TRUST = [
  { to: "/trust-safety", labelBn: "ট্রাস্ট ও নিরাপত্তা", labelEn: "Trust & Safety" },
  { to: "/pricing", labelBn: "মূল্য ও ফি", labelEn: "Pricing & Charges" },
  { to: "/faq", labelBn: "সাধারণ প্রশ্ন", labelEn: "FAQ" },
  { to: "/terms", labelBn: "শর্তাবলী", labelEn: "Terms" },
  { to: "/privacy", labelBn: "গোপনীয়তা", labelEn: "Privacy" },
] as const;

export function Footer() {
  const { t, i18n } = useTranslation();
  const isBn = i18n.language !== "en";
  const pickLabel = (it: { labelBn: string; labelEn: string }) => (isBn ? it.labelBn : it.labelEn);
  return (
    <footer className="mt-20 border-t border-border bg-surface text-surface-foreground">
      <div className="container-page py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {t("footer.tagline")}
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

          <FooterCol title={t("footer.colServices")} items={COL_SERVICES.map((it) => ({ to: it.to, label: pickLabel(it) }))} />
          <FooterCol title={t("footer.colCompany")} items={COL_COMPANY.map((it) => ({ to: it.to, label: pickLabel(it) }))} />
          <FooterCol title={t("footer.colTrust")} items={COL_TRUST.map((it) => ({ to: it.to, label: pickLabel(it) }))} />
        </div>

        <div className="mt-10 flex justify-center border-t border-border pt-8">
          <PaymentsWall />
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} {t("brand.name")}. {t("footer.rights")}</p>
          <p>{t("footer.expansion")}</p>
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
