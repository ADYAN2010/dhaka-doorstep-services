import { createFileRoute } from "@tanstack/react-router";
import { MigrationPlaceholder } from "@/components/migration-placeholder";

export const Route = createFileRoute("/admin/console/cities")({
  component: () => <MigrationPlaceholder title="Cities" description="Restoring on Supabase in Phase 3." />,
});
