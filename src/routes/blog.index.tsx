import { createFileRoute } from "@tanstack/react-router";
import { MigrationPlaceholder } from "@/components/migration-placeholder";

export const Route = createFileRoute("/blog/")({
  component: () => <MigrationPlaceholder title="Blog" description="Restoring on Supabase in Phase 2." />,
});
