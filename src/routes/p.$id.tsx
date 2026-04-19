import { createFileRoute } from "@tanstack/react-router";
import { MigrationPlaceholder } from "@/components/migration-placeholder";

/**
 * Public provider detail page — stubbed during the MySQL migration.
 * The Supabase-backed loader will be rebuilt once the Express backend
 * exposes provider profile + categories + areas + reviews + availability.
 */
export const Route = createFileRoute("/p/$id")({
  component: ProviderDetailPage,
  head: () => ({
    meta: [
      { title: "Provider · Shebabd" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function ProviderDetailPage() {
  return (
    <MigrationPlaceholder
      title="Provider profile — being rebuilt"
      description="Provider profiles are moving to the new backend. They'll be back online shortly."
      backTo="/"
      backLabel="Back to home"
    />
  );
}
