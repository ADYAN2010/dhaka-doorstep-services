import { createFileRoute } from "@tanstack/react-router";
import { MigrationPlaceholder } from "@/components/migration-placeholder";

export const Route = createFileRoute("/admin/console/services")({
  component: () => <MigrationPlaceholder title="Services" description="Restoring on Supabase in Phase 3." />,
});
