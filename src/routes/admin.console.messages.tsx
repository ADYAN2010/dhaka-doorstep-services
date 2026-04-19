import { createFileRoute } from "@tanstack/react-router";
import { MigrationPlaceholder } from "@/components/migration-placeholder";

export const Route = createFileRoute("/admin/console/messages")({
  component: () => <MigrationPlaceholder title="Messages" description="Restoring on Supabase in Phase 3." />,
});
