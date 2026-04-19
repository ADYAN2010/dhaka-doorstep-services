import { createFileRoute } from "@tanstack/react-router";
import { MigrationPlaceholder } from "@/components/migration-placeholder";

export const Route = createFileRoute("/admin/console/applications")({
  component: () => <MigrationPlaceholder title="Provider applications" description="Restoring on Supabase in Phase 3." />,
});
