/**
 * `useSavedProvider` — stubbed during the MySQL migration. The
 * Supabase-backed `saved_providers` table has been removed; this hook
 * keeps the same surface so existing UI doesn't break, but acts as a
 * client-only no-op for now.
 */
import { useState } from "react";
import { useAuth } from "@/components/auth-provider";

export function useSavedProvider(_providerId: string) {
  const { user } = useAuth();
  const [saved] = useState(false);

  return {
    saved,
    working: false,
    signedIn: !!user,
    toggle: () => {
      /* saved-providers feature is being migrated to the new backend */
    },
  };
}
