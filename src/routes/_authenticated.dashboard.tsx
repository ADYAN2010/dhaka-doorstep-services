import { createFileRoute } from "@tanstack/react-router";
import { MigrationPlaceholder } from "@/components/migration-placeholder";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: () => (
    <MigrationPlaceholder
      title="Your dashboard is being upgraded"
      description="We're moving customer accounts to a faster backend. Bookings, saved providers, and payments will be back here shortly."
    />
  ),
});
