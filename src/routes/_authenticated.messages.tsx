import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageSquare, Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/site-shell";

export const Route = createFileRoute("/_authenticated/messages")({
  component: MessagesPage,
});

type Thread = {
  id: string;
  booking_id: string;
  customer_id: string;
  provider_id: string;
  last_message_at: string;
  customer_unread_count: number;
  provider_unread_count: number;
};

function MessagesPage() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("message_threads")
        .select("id, booking_id, customer_id, provider_id, last_message_at, customer_unread_count, provider_unread_count")
        .order("last_message_at", { ascending: false });
      setThreads((data ?? []) as Thread[]);
      setLoading(false);
    })();
  }, [user]);

  return (
    <SiteShell>
      <section className="container-page max-w-3xl py-10">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Messages</h1>
        <p className="mt-1 text-sm text-muted-foreground">Conversations from your bookings.</p>

        {loading ? (
          <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : threads.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary mx-auto">
              <MessageSquare className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-base font-semibold">No conversations yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Once a provider is assigned to your booking, you'll be able to chat with them here.
            </p>
          </div>
        ) : (
          <ul className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card shadow-soft">
            {threads.map((t) => {
              const isCustomer = user?.id === t.customer_id;
              const unread = isCustomer ? t.customer_unread_count : t.provider_unread_count;
              return (
                <li key={t.id}>
                  <Link to="/booking-status/$id" params={{ id: t.booking_id }} className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-muted/40">
                    <div>
                      <div className="font-medium">Booking conversation</div>
                      <div className="text-xs text-muted-foreground">{new Date(t.last_message_at).toLocaleString()}</div>
                    </div>
                    {unread > 0 && (
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                        {unread}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </SiteShell>
  );
}
