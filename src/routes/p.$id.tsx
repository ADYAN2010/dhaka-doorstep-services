import { createFileRoute } from "@tanstack/react-router";
import { MigrationPlaceholder } from "@/components/migration-placeholder";

export const Route = createFileRoute("/p/$id")({
  component: () => <MigrationPlaceholder title="Provider profile" description="Restoring on Supabase in Phase 2." />,
});
