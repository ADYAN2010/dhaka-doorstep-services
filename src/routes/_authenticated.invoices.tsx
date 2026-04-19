import { createFileRoute } from "@tanstack/react-router";
import { MigrationPlaceholder } from "@/components/migration-placeholder";

export const Route = createFileRoute("/_authenticated/invoices")({
  component: () => (
    <MigrationPlaceholder
      title="Invoices are being upgraded"
      description="Invoice history and PDF downloads are being rebuilt on our new backend."
    />
  ),
});
