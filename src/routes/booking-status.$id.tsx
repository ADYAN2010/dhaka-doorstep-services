import { createFileRoute } from "@tanstack/react-router";
import { MigrationPlaceholder } from "@/components/migration-placeholder";

export const Route = createFileRoute("/booking-status/$id")({
  component: () => <MigrationPlaceholder title="Booking status" description="Restoring on Supabase in Phase 2." />,
});
