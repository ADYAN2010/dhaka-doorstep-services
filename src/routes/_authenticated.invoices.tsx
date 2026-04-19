import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, FileText } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/site-shell";

export const Route = createFileRoute("/_authenticated/invoices")({
  component: InvoicesPage,
});

type Invoice = {
  id: string;
  invoice_number: string;
  total: number;
  currency: string;
  status: string;
  issued_at: string | null;
  paid_at: string | null;
  pdf_url: string | null;
};

function InvoicesPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      // RLS already filters to invoices for bookings the user owns/serves.
      const { data } = await supabase
        .from("invoices")
        .select("id, invoice_number, total, currency, status, issued_at, paid_at, pdf_url")
        .order("created_at", { ascending: false });
      setRows((data ?? []) as Invoice[]);
      setLoading(false);
    })();
  }, [user]);

  return (
    <SiteShell>
      <section className="container-page py-10">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Invoices</h1>
        <p className="mt-1 text-sm text-muted-foreground">Invoices issued for your bookings.</p>

        <div className="mt-8 rounded-2xl border border-border bg-card shadow-soft">
          {loading ? (
            <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : rows.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-muted-foreground">
              <FileText className="mx-auto h-6 w-6 text-muted-foreground/60" />
              <div className="mt-2">No invoices yet.</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">Number</th>
                    <th className="px-3 py-2 text-right">Total</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Issued</th>
                    <th className="px-3 py-2 text-left">Paid</th>
                    <th className="px-3 py-2 text-right">PDF</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-t border-border">
                      <td className="px-3 py-2 font-mono text-xs">{r.invoice_number}</td>
                      <td className="px-3 py-2 text-right font-semibold">{r.currency} {Number(r.total).toFixed(2)}</td>
                      <td className="px-3 py-2 capitalize">{r.status}</td>
                      <td className="px-3 py-2 text-muted-foreground">{r.issued_at ? new Date(r.issued_at).toLocaleDateString() : "—"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{r.paid_at ? new Date(r.paid_at).toLocaleDateString() : "—"}</td>
                      <td className="px-3 py-2 text-right">
                        {r.pdf_url ? (
                          <a href={r.pdf_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">Download</a>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </SiteShell>
  );
}
