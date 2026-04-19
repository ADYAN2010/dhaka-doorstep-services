/** Restoring on Supabase in Phase 3. Shape preserved for SavedHeartButton. */
export function useSavedProvider(_providerId?: string) {
  return {
    saved: false,
    working: false,
    signedIn: false,
    toggle: async () => {},
    isSaved: false,
    loading: false,
  };
}
