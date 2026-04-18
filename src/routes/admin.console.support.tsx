import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Inbox, Loader2, Search, Check, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/console/support")({
  component: SupportPage,
});

type Msg = {
  id: string; full_name: string; email: string; phone: string | null;
  message: string; handled: boolean; created_at: string;
};

function SupportPage() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"open" | "handled" | "all">("open");

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message); else setMsgs((data ?? []) as Msg[]);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  async function toggleHandled(id: string, handled: boolean) {
    setBusy(id);
    const { error } = await supabase.from("contact_messages").update({ handled }).eq("id", id);
    setBusy(null);
    if (error) return toast.error(error.message);
    setMsgs((prev) => prev.map((m) => (m.id === id ? { ...m, handled } : m)));
    toast.success(handled ? "Marked handled" : "Reopened");
  }

  const filtered = useMemo(() => {
    let list = msgs;
    if (filter === "open") list = list.filter((m) => !m.handled);
    else if (filter === "handled") list = list.filter((m) => m.handled);
    if (q) {
      const t = q.toLowerCase();
      list = list.filter((m) => [m.full_name, m.email, m.phone, m.message].some((v) => v?.toLowerCase().includes(t)));
    }
    return list;
  }, [msgs, filter, q]);

  const open = msgs.filter((m) => !m.handled).length;

  return (
    <div>
      <AdminPageHeader
        eyebrow="Support"
        title="Customer inbox"
        description="Inbound messages from the contact form. Mark resolved when you've responded."
        actions={<Button variant="outline" onClick={load} disabled={loading}>{loading && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}Refresh</Button>}
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Stat label="Open tickets" value={open} accent={open > 0} />
        <Stat label="Handled" value={msgs.length - open} />
        <Stat label="Total" value={msgs.length} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search messages…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1">
          {(["open", "handled", "all"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                filter === f ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid place-items-center py-16"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Inbox} title="No messages" description={filter === "open" ? "Inbox zero. Nice work." : undefined} />
      ) : (
        <div className="grid gap-3">
          {filtered.map((m) => (
            <div key={m.id} className={`rounded-2xl border p-4 shadow-soft ${m.handled ? "border-border bg-card opacity-70" : "border-primary/20 bg-card"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-semibold">{m.full_name}</div>
                    {!m.handled && <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">Open</span>}
                    <span className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString()}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    <a href={`mailto:${m.email}`} className="inline-flex items-center gap-1 hover:underline"><Mail className="h-3 w-3" />{m.email}</a>
                    {m.phone && <a href={`tel:${m.phone}`} className="inline-flex items-center gap-1 hover:underline"><Phone className="h-3 w-3" />{m.phone}</a>}
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm">{m.message}</p>
                </div>
                <Button size="sm" variant={m.handled ? "outline" : "default"} onClick={() => toggleHandled(m.id, !m.handled)} disabled={busy === m.id}>
                  {busy === m.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  {m.handled ? "Reopen" : "Mark handled"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 shadow-soft ${accent ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}
