import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Mail, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/page-header";
import { SectionCard, StatusPill } from "@/components/admin/primitives";
import { EmptyState, ErrorState } from "@/components/admin/empty-state";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/console/messages")({
  component: MessagesPage,
});

type Msg = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  message: string;
  handled: boolean;
  created_at: string;
};

function MessagesPage() {
  const [rows, setRows] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("contact_messages")
      .select("id, full_name, email, phone, message, handled, created_at")
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setRows((data ?? []) as Msg[]);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  async function markHandled(id: string) {
    const { error } = await supabase.from("contact_messages").update({ handled: true }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Marked as handled");
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, handled: true } : r)));
  }

  return (
    <div>
      <AdminPageHeader
        eyebrow="Support"
        title="Contact messages"
        description="Messages submitted from the public contact form."
        breadcrumbs={[{ label: "Admin", to: "/admin/console" }, { label: "Messages" }]}
      />
      <SectionCard padded={false}>
        {loading ? (
          <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : error ? (
          <div className="p-5"><ErrorState description={error} /></div>
        ) : rows.length === 0 ? (
          <div className="p-5"><EmptyState icon={Mail} title="Inbox is empty" description="New contact submissions will appear here." /></div>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((m) => (
              <li key={m.id} className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{m.full_name}</span>
                      <StatusPill label={m.handled ? "handled" : "new"} tone={m.handled ? "success" : "warning"} />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {m.email}{m.phone ? ` · ${m.phone}` : ""} · {new Date(m.created_at).toLocaleString()}
                    </div>
                  </div>
                  {!m.handled && (
                    <Button size="sm" variant="outline" onClick={() => markHandled(m.id)}>
                      <Check className="mr-1 h-3.5 w-3.5" />
                      Mark handled
                    </Button>
                  )}
                </div>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground/90">{m.message}</p>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
