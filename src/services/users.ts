/**
 * Users / profiles / roles service.
 *
 * Backed by Supabase `profiles` and `user_roles`.
 */

import { supabase } from "@/integrations/supabase/client";
import type {
  AppRole,
  Customer,
  ID,
  ProviderApprovalStatus,
  User,
} from "@/domain/types";
import type { Database } from "@/integrations/supabase/types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type RoleRow = Database["public"]["Tables"]["user_roles"]["Row"];

function toUser(profile: ProfileRow, roles: AppRole[], email: string | null): User {
  return {
    id: profile.id,
    email,
    fullName: profile.full_name,
    phone: profile.phone,
    avatarUrl: profile.avatar_url,
    area: profile.area,
    roles,
    providerStatus: profile.provider_status as ProviderApprovalStatus,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  };
}

export const usersService = {
  /** Currently authenticated user (or null if signed out). */
  me: async (): Promise<User | null> => {
    const { data: auth } = await supabase.auth.getUser();
    const u = auth.user;
    if (!u) return null;

    const [profile, roles] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", u.id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", u.id),
    ]);
    if (profile.error) throw profile.error;
    if (roles.error) throw roles.error;
    if (!profile.data) return null;

    return toUser(
      profile.data,
      ((roles.data ?? []) as Pick<RoleRow, "role">[]).map((r) => r.role as AppRole),
      u.email ?? null,
    );
  },

  get: async (id: ID): Promise<User | null> => {
    const [profile, roles] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", id),
    ]);
    if (profile.error) throw profile.error;
    if (roles.error) throw roles.error;
    if (!profile.data) return null;
    return toUser(
      profile.data,
      ((roles.data ?? []) as Pick<RoleRow, "role">[]).map((r) => r.role as AppRole),
      null,
    );
  },

  /** Customers list — derived: profiles that are not approved providers. */
  listCustomers: async (): Promise<Customer[]> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(
      (p): Customer => ({
        ...toUser(p, ["customer"], null),
        totalBookings: 0,
        lastBookingAt: null,
      }),
    );
  },
};
