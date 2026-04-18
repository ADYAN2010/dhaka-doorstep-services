import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth-provider";
import { toast } from "sonner";

export function useSavedProvider(providerId: string | null | undefined) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!user || !providerId) {
      setSaved(false);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("saved_providers")
        .select("id")
        .eq("user_id", user.id)
        .eq("provider_id", providerId)
        .maybeSingle();
      if (!cancelled) {
        setSaved(!!data);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, providerId]);

  const toggle = useCallback(async () => {
    if (!user || !providerId || working) return;
    setWorking(true);
    const next = !saved;
    setSaved(next); // optimistic
    if (next) {
      const { error } = await supabase
        .from("saved_providers")
        .insert({ user_id: user.id, provider_id: providerId });
      if (error) {
        setSaved(false);
        toast.error("Could not save provider", { description: error.message });
      } else {
        toast.success("Saved to your list");
      }
    } else {
      const { error } = await supabase
        .from("saved_providers")
        .delete()
        .eq("user_id", user.id)
        .eq("provider_id", providerId);
      if (error) {
        setSaved(true);
        toast.error("Could not remove", { description: error.message });
      } else {
        toast.success("Removed from saved");
      }
    }
    setWorking(false);
  }, [user, providerId, saved, working]);

  return { saved, loading, working, toggle, signedIn: !!user };
}
