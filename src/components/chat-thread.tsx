/**
 * Placeholder chat thread. Realtime messaging UI will be wired up in a
 * follow-up — Supabase Realtime is already enabled on `messages`.
 */
import { MigrationPlaceholder } from "@/components/migration-placeholder";

type Props = {
  bookingId?: string;
  threadId?: string | null;
};

export function ChatThread(_props: Props) {
  return (
    <MigrationPlaceholder
      title="Chat coming soon"
      description="In-booking messaging will be available shortly."
    />
  );
}
