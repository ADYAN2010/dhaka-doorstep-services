import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, MessageCircle, ChevronLeft } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth-provider";
import { SiteShell } from "@/components/site-shell";
import { ChatThread } from "@/components/chat-thread";

const searchSchema = z.object({
  thread: z.string().uuid().optional(),
  booking: z.string().uuid().optional(),
});

export const Route = createFileRoute("/_authenticated/messages")({
  component: MessagesPage,
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Messages · Shebabd" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

type ThreadRow = {
  id: string;
  booking_id: string;
  customer_id: string;
  provider_id: string;
  last_message_at: string;
  customer_unread_count: number;
  provider_unread_count: number;
};

type BookingRow = {
  id: string;
  category: string;
  service: string | null;
  area: string;
  status: string;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

function MessagesPage() {
  const { user, roles } = useAuth();
  const search = useSearch({ from: "/_authenticated/messages" });
  const navigate = useNavigate();
  const isAdmin = roles.includes("admin");

  const [threads, setThreads] = useState<ThreadRow[] | null>(null);
  const [bookings, setBookings] = useState<Record<string, BookingRow>>({});
  const [profiles, setProfiles] = useState<Record<string, ProfileRow>>({});
  const [activeId, setActiveId] = useState<string | null>(search.thread ?? null);

  // Resolve booking → thread on first load if `?booking=` is present.
  useEffect(() => {
    if (!search.booking || !user) return;
    (async () => {
      const { data, error } = await supabase.rpc("get_or_create_thread", {
        _booking_id: search.booking,
      });
      if (error) return;
      const t = data as unknown as ThreadRow;
      setActiveId(t.id);
      void navigate({
        to: "/messages",
        search: { thread: t.id },
        replace: true,
      });
    })();
  }, [search.booking, user, navigate]);

  // Load all threads for this user (or all, for admin).
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const load = async () => {
      let q = supabase
        .from("message_threads")
        .select("id, booking_id, customer_id, provider_id, last_message_at, customer_unread_count, provider_unread_count")
        .order("last_message_at", { ascending: false });
      if (!isAdmin) {
        q = q.or(`customer_id.eq.${user.id},provider_id.eq.${user.id}`);
      }
      const { data: ts } = await q;
      if (cancelled) return;
      const list = (ts ?? []) as ThreadRow[];
      setThreads(list);

      if (list.length === 0) return;

      const bookingIds = list.map((t) => t.booking_id);
      const userIds = Array.from(
        new Set(list.flatMap((t) => [t.customer_id, t.provider_id])),
      );

      const [{ data: bs }, { data: ps }] = await Promise.all([
        supabase
          .from("bookings")
          .select("id, category, service, area, status")
          .in("id", bookingIds),
        supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", userIds),
      ]);

      if (cancelled) return;
      const bMap: Record<string, BookingRow> = {};
      (bs ?? []).forEach((b) => {
        bMap[b.id] = b as BookingRow;
      });
      const pMap: Record<string, ProfileRow> = {};
      (ps ?? []).forEach((p) => {
        pMap[p.id] = p as ProfileRow;
      });
      setBookings(bMap);
      setProfiles(pMap);

      if (!activeId && list.length > 0) {
        setActiveId(list[0].id);
        void navigate({
          to: "/messages",
          search: { thread: list[0].id },
          replace: true,
        });
      }
    };

    void load();

    const channel = supabase
      .channel(`messages-list-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "message_threads" },
        () => void load(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAdmin]);

  const active = useMemo(
    () => threads?.find((t) => t.id === activeId) ?? null,
    [threads, activeId],
  );

  function unreadFor(t: ThreadRow): number {
    if (!user) return 0;
    if (user.id === t.customer_id) return t.customer_unread_count;
    if (user.id === t.provider_id) return t.provider_unread_count;
    return 0;
  }

  function otherPartyOf(t: ThreadRow): ProfileRow | null {
    if (!user) return null;
    const otherId = user.id === t.customer_id ? t.provider_id : t.customer_id;
    return profiles[otherId] ?? null;
  }

  return (
    <SiteShell>
      <div className="container-page py-6 md:py-10">
        <h1 className="mb-1 text-2xl font-bold tracking-tight md:text-3xl">Messages</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Chat with your assigned {isAdmin ? "customers and providers (read-only)" : "provider or customer"}.
        </p>

        <div className="grid gap-4 md:grid-cols-[320px_1fr] md:gap-6">
          {/* Inbox list */}
          <aside
            className={`overflow-hidden rounded-2xl border border-border bg-card ${active ? "hidden md:block" : "block"}`}
          >
            {threads === null ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : threads.length === 0 ? (
              <EmptyInbox />
            ) : (
              <ul className="max-h-[70vh] divide-y divide-border overflow-y-auto">
                {threads.map((t) => {
                  const other = otherPartyOf(t);
                  const booking = bookings[t.booking_id];
                  const unread = unreadFor(t);
                  const initials = (other?.full_name || "?").slice(0, 1).toUpperCase();
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveId(t.id);
                          void navigate({
                            to: "/messages",
                            search: { thread: t.id },
                            replace: true,
                          });
                        }}
                        className={`flex w-full items-start gap-3 p-3 text-left transition-colors hover:bg-muted ${
                          activeId === t.id ? "bg-muted" : ""
                        }`}
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-primary text-sm font-bold text-primary-foreground">
                          {other?.avatar_url ? (
                            <img src={other.avatar_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            initials
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="truncate text-sm font-semibold text-foreground">
                              {other?.full_name || "Unnamed"}
                            </span>
                            <span className="shrink-0 text-[10px] text-muted-foreground">
                              {new Date(t.last_message_at).toLocaleDateString([], {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            {booking
                              ? `${booking.category}${booking.service ? " · " + booking.service : ""}`
                              : "Booking"}
                          </div>
                        </div>
                        {unread > 0 && (
                          <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                            {unread}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>

          {/* Thread pane */}
          <section
            className={`flex h-[70vh] min-h-[480px] flex-col ${active ? "block" : "hidden md:flex"}`}
          >
            {active ? (
              <>
                <div className="mb-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveId(null);
                      void navigate({ to: "/messages", search: {}, replace: true });
                    }}
                    className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-muted md:hidden"
                  >
                    <ChevronLeft className="h-3 w-3" /> Inbox
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-foreground">
                      {(otherPartyOf(active)?.full_name) || "Conversation"}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {bookings[active.booking_id]
                        ? `${bookings[active.booking_id].category}${
                            bookings[active.booking_id].service
                              ? " · " + bookings[active.booking_id].service
                              : ""
                          } · ${bookings[active.booking_id].area}`
                        : "Booking conversation"}
                    </div>
                  </div>
                </div>
                <ChatThread
                  threadId={active.id}
                  customerId={active.customer_id}
                  providerId={active.provider_id}
                  participants={profiles}
                  className="flex-1"
                />
              </>
            ) : (
              <div className="hidden h-full flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card text-center text-muted-foreground md:flex">
                <MessageCircle className="mb-3 h-10 w-10" />
                <p className="text-sm">Pick a conversation to get started.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </SiteShell>
  );
}

function EmptyInbox() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
      <MessageCircle className="mb-3 h-10 w-10 text-muted-foreground" />
      <p className="text-sm font-medium text-foreground">No conversations yet</p>
      <p className="mt-1 text-xs text-muted-foreground">
        When a provider is assigned to a booking, your chat appears here.
      </p>
    </div>
  );
}
