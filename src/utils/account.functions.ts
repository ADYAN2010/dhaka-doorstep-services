/**
 * Stubbed during the MySQL migration. The original Supabase-backed
 * `/utils/account.functions.ts` exposed `deleteOwnAccount` as a TanStack
 * server function. The MySQL `customers` controller will own this
 * functionality going forward; for now we expose a no-op stub so existing
 * imports keep type-checking.
 */
import { createServerFn } from "@tanstack/react-start";

export const deleteOwnAccount = createServerFn({ method: "POST" }).handler(
  async () => {
    return {
      success: false as const,
      error:
        "Account deletion is being migrated to the new backend and is temporarily unavailable.",
    };
  },
);
