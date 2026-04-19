import { createFileRoute } from "@tanstack/react-router";
import { MigrationPlaceholder } from "@/components/migration-placeholder";

export const Route = createFileRoute("/admin/console/system-status")({
  component: () => <MigrationPlaceholder title="System status" description="Restoring on Supabase in Phase 3." />,
});
