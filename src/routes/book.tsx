import { createFileRoute } from "@tanstack/react-router";
import { MigrationPlaceholder } from "@/components/migration-placeholder";

export const Route = createFileRoute("/book")({
  component: () => <MigrationPlaceholder title="Book a service" description="Restoring on Supabase in Phase 2." />,
});
