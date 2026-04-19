import { createFileRoute } from "@tanstack/react-router";
import { MigrationPlaceholder } from "@/components/migration-placeholder";

export const Route = createFileRoute("/admin/console/providers")({
  component: () => <MigrationPlaceholder title="Providers" description="Restoring on Supabase in Phase 3." />,
});
