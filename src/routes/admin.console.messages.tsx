/**
 * Admin → Contact messages
 * Calls GET /api/contact-messages.
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Inbox, Loader2, Search, RefreshCw, Mail, Phone, User, MessageSquareText,
} from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import {
  contactMessagesApi, asBool, type AdminContactMessage,
} from "@/lib/admin-api";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/console/messages")({
  component: MessagesPage,
  head: () => ({
    meta: [
      { title: "Contact messages · Admin · Shebabd" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function MessagesPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<AdminContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "open" | "handled">("all");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    contactMessagesApi
      .list({ limit: 200 })
      .then((res) => {
        if (cancelled) return;
        setRows(res.data ?? []);
      })
      .catch((e) => {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 401) {
          return navigate({ to: "/admin/backend/login" });
        }
        toast.error(e instanceof Error ? e.message : "Failed to load messages");
      })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [navigate, tick]);

  const filtered = useMemo(() => {
    let list = rows;
    if (filter === "open") list = list.filter((r) => !asBool(r.handled));
    if (filter === "handled") list = list.filter((r) => asBool(r.handled));
    if (q) {
      const t = q.toLowerCase();
      list = list.filter((r) =>
        [r.full_name, r.email, r.phone, r.message].some((v) => v?.toLowerCase().includes(t)),
      );
    }
    return list;
  }, [rows, filter, q]);

  const openCount = rows.filter((r) => !asBool(r.handled)).length;

  return (
    <div>
      <AdminPageHeader
        eyebrow="Support"
        title="Contact messages"
        description="Messages submitted from /contact, live from /api/contact-messages."
        actions={
          <Button variant="outline" onClick={() => setTick((t) => t + 1)} disabled={loading}>
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Stat label="Total messages" value={rows.length.toLocaleString()} />
        <Stat label="Open" value={openCount.toLocaleString()} accent={openCount > 0} />
        <Stat label="Handled" value={(rows.length - openCount).toLocaleString()} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-2">
          {(["all", "open", "handled"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                filter === f
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative ml-auto w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search messages…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid place-items-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={q || filter !== "all" ? "No matches" : "No messages yet"}
          description={
            !q && filter === "all"
              ? "Messages submitted from the Contact form will appear here."
              : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => (
            <article
              key={m.id}
              className="rounded-2xl border border-border bg-card p-4 shadow-soft"
            >
              <header className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{m.full_name}</span>
                    {!asBool(m.handled) && (
                      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:text-amber-300">
                        Open
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {m.email}
                    </span>
                    {m.phone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {m.phone}
                      </span>
                    )}
                  </div>
                </div>
                <time className="shrink-0 text-xs text-muted-foreground">
                  {new Date(m.created_at).toLocaleString()}
                </time>
              </header>
              <div className="mt-3 flex gap-2 rounded-lg bg-muted/40 p-3 text-sm leading-relaxed">
                <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <p className="whitespace-pre-wrap break-words">{m.message}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className={`rounded-xl border p-4 shadow-soft ${
        accent ? "border-primary/30 bg-primary/5" : "border-border bg-card"
      }`}
    >
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}
