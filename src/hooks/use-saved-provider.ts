/** Restoring on Supabase in Phase 3. */
export function useSavedProvider(_providerId?: string) {
  return {
    isSaved: false,
    loading: false,
    toggle: async () => {},
  };
}
