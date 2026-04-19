/**
 * Migration placeholder — shown on legacy pages whose Supabase data layer
 * has been removed during the MySQL migration. Keeps the build green and
 * gives users a friendly "we're working on it" message.
 */
import { Link } from "@tanstack/react-router";
import { Construction, ArrowLeft } from "lucide-react";
import { SiteShell } from "@/components/site-shell";

type Props = {
  title: string;
  description?: string;
  backTo?: string;
  backLabel?: string;
};

export function MigrationPlaceholder({
  title,
  description = "This page is being rebuilt on our new backend. It will be back online shortly.",
  backTo = "/",
  backLabel = "Back to home",
}: Props) {
  return (
    <SiteShell>
      <section className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Construction className="h-7 w-7 text-muted-foreground" />
        </div>
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        <p className="mt-3 max-w-md text-sm text-muted-foreground">{description}</p>
        <Link
          to={backTo}
          className="mt-8 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>
      </section>
    </SiteShell>
  );
}
