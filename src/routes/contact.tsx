import { createFileRoute } from "@tanstack/react-router";
import { MigrationPlaceholder } from "@/components/migration-placeholder";

export const Route = createFileRoute("/contact")({
  component: () => <MigrationPlaceholder title="Contact us" description="Restoring on Supabase in Phase 2." />,
});
