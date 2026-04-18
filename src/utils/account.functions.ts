import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Permanently delete the authenticated user's account.
 *
 * - Removes their roles, coverage rows, profile and auth user
 * - Bookings keep `user_id` history (it's nullable) so providers still see them
 * - Uses the admin client (service role) so RLS doesn't block it; auth is
 *   enforced by the requireSupabaseAuth middleware which proves the caller
 *   owns the userId being deleted.
 */
export const deleteOwnAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;

    // 1. Wipe owned rows (bookings.user_id is nullable, so just null it)
    const ops = await Promise.all([
      supabaseAdmin.from("user_roles").delete().eq("user_id", userId),
      supabaseAdmin.from("provider_categories").delete().eq("user_id", userId),
      supabaseAdmin.from("provider_areas").delete().eq("user_id", userId),
      supabaseAdmin.from("provider_applications").delete().eq("user_id", userId),
      supabaseAdmin.from("bookings").update({ user_id: null }).eq("user_id", userId),
      supabaseAdmin.from("profiles").delete().eq("id", userId),
    ]);

    const firstError = ops.find((r) => r.error);
    if (firstError?.error) {
      console.error("deleteOwnAccount cleanup failed:", firstError.error);
      return { success: false as const, error: firstError.error.message };
    }

    // 2. Delete the auth user itself
    const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authErr) {
      console.error("deleteOwnAccount auth deletion failed:", authErr);
      return { success: false as const, error: authErr.message };
    }

    return { success: true as const };
  });
