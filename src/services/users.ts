/**
 * Users / profiles / roles service shim. Active routes read profile and
 * role data directly from Supabase via the auth provider and admin pages.
 * Kept here only as a typed no-op for any remaining legacy callers.
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
