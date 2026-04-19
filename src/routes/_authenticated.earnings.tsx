import { createFileRoute } from "@tanstack/react-router";
import { MigrationPlaceholder } from "@/components/migration-placeholder";

export const Route = createFileRoute("/_authenticated/earnings")({
  component: () => (
    <MigrationPlaceholder
      title="Earnings are being upgraded"
      description="Payouts, commissions, and earnings history are being rebuilt on our new backend."
    />
  ),
});
