import { createFileRoute } from "@tanstack/react-router";
import { MigrationPlaceholder } from "@/components/migration-placeholder";

export const Route = createFileRoute("/admin/console/operations")({
  component: () => (
    <MigrationPlaceholder
      title="Operations — being migrated"
      description="The operations dashboard is moving to the new MySQL backend. Use the Bookings page in the meantime."
      backTo="/admin/console/bookings"
      backLabel="Go to bookings"
    />
  ),
});
