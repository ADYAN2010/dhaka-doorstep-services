import { createFileRoute } from "@tanstack/react-router";
import { MigrationPlaceholder } from "@/components/migration-placeholder";

/**
 * Public providers directory — stubbed during the MySQL migration.
 * The Supabase-backed implementation will be rebuilt once the Express
 * backend exposes provider profiles, categories, areas and review stats.
 */
export const Route = createFileRoute("/providers/")({
  component: ProvidersIndexPage,
  head: () => ({
    meta: [
      { title: "Find a provider · Shebabd" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function ProvidersIndexPage() {
  return (
    <MigrationPlaceholder
      title="Provider directory — being rebuilt"
      description="Our provider listings are moving to a new backend. They'll be back online shortly."
      backTo="/"
      backLabel="Back to home"
    />
  );
}
