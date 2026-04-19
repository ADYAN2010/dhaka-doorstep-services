/**
 * Users / profiles / roles service — stubbed during the MySQL migration.
 *
 * The MySQL backend exposes `/api/customers` and `/api/customer-auth/me`
 * for the data this module previously read from Supabase `profiles` and
 * `user_roles`. Those flows are now consumed directly by the auth provider
 * and the relevant admin pages, so the legacy `usersService` shape is
 * provided here only as a typed no-op for any remaining callers.
 */
import type { Customer, ID, User } from "@/domain/types";

export const usersService = {
  me: async (): Promise<User | null> => {
    return null;
  },

  get: async (_id: ID): Promise<User | null> => {
    return null;
  },

  listCustomers: async (): Promise<Customer[]> => {
    return [];
  },
};
