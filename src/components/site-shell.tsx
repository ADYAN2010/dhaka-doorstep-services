import type { ReactNode } from "react";
import { Navbar } from "./navbar";
import { Footer } from "./footer";
import { MobileStickyCTA } from "./mobile-sticky-cta";
import { FloatingHelp } from "./floating-help";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 pb-32 md:pb-0">{children}</main>
      <Footer />
      <MobileStickyCTA />
      <FloatingHelp />
    </div>
  );
}
