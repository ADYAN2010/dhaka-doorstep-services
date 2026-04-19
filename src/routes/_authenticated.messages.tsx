import { createFileRoute } from "@tanstack/react-router";
import { MigrationPlaceholder } from "@/components/migration-placeholder";

export const Route = createFileRoute("/_authenticated/messages")({
  component: () => (
    <MigrationPlaceholder
      title="Messages are being upgraded"
      description="Customer ↔ provider messaging is being rebuilt on our new backend."
    />
  ),
});
