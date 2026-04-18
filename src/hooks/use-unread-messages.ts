import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth-provider";

/**
 * Returns the total unread-message count for the current user across all
 * threads they participate in. Subscribes to message_threads UPDATE events
 * so the badge stays live without polling.
 */
export function useUnreadMessages(): number {
  const { user } = useAuth();
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!user) {
      setTotal(0);
      return;
    }

    let cancelled = false;

    const refresh = async () => {
      const { data } = await supabase
        .from("message_threads")
        .select("customer_id, provider_id, customer_unread_count, provider_unread_count")
        .or(`customer_id.eq.${user.id},provider_id.eq.${user.id}`);

      if (cancelled) return;
      const sum = (data ?? []).reduce((acc, row) => {
        if (row.customer_id === user.id) return acc + (row.customer_unread_count ?? 0);
        if (row.provider_id === user.id) return acc + (row.provider_unread_count ?? 0);
        return acc;
      }, 0);
      setTotal(sum);
    };

    void refresh();

    const channel = supabase
      .channel(`unread-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "message_threads" },
        () => void refresh(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user]);

  return total;
}
