import { createFileRoute } from "@tanstack/react-router";
import { MigrationPlaceholder } from "@/components/migration-placeholder";

export const Route = createFileRoute("/admin/console/operations")({
  component: () => (
    <MigrationPlaceholder
      title="Operations"
      description="The operations dashboard is coming soon. Use the Bookings page in the meantime."
      backTo="/admin/console"
      backLabel="Back to admin console"
    />
  ),
});
