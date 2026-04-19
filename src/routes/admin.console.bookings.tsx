import { createFileRoute } from "@tanstack/react-router";
import { MigrationPlaceholder } from "@/components/migration-placeholder";

export const Route = createFileRoute("/admin/console/bookings")({
  component: () => <MigrationPlaceholder title="Bookings" description="Restoring on Supabase in Phase 3." />,
});
