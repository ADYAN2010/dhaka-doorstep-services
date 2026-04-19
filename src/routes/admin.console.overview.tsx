import { createFileRoute } from "@tanstack/react-router";
import { MigrationPlaceholder } from "@/components/migration-placeholder";

export const Route = createFileRoute("/admin/console/overview")({
  component: () => <MigrationPlaceholder title="Overview" description="Restoring on Supabase in Phase 3." />,
});
