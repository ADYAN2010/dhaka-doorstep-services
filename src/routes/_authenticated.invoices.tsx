import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth-provider";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { downloadInvoicePdf, type InvoicePdfData } from "@/lib/invoice-pdf";

export const Route = createFileRoute("/_authenticated/invoices")({
  component: InvoicesPage,
  head: () => ({
    meta: [
      { title: "Invoices · Shebabd" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

type InvoiceRow = {
  id: string;
  booking_id: string;
  invoice_number: string;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  status: string;
  issued_at: string | null;
  paid_at: string | null;
  created_at: string;
};

type BookingRow = {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  address: string | null;
  category: string;
  service: string | null;
  area: string;
  preferred_date: string;
  preferred_time_slot: string;
  provider_id: string | null;
};

type ProfileRow = { id: string; full_name: string; phone: string | null };

type PaymentRow = {
  id: string;
  booking_id: string;
  amount: number;
  method: string;
  gateway: string;
  gateway_ref: string | null;
  created_at: string;
};

function fmt(n: number, cur: string) {
  return `${cur} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function statusClass(s: string) {
  if (s === "paid") return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
  if (s === "issued") return "bg-blue-500/15 text-blue-700 dark:text-blue-400";
  if (s === "void") return "bg-muted text-muted-foreground";
  return "bg-amber-500/15 text-amber-700 dark:text-amber-400";
}

function InvoicesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [bookings, setBookings] = useState<Record<string, BookingRow>>({});
  const [providers, setProviders] = useState<Record<string, ProfileRow>>({});
  const [paymentsByBooking, setPaymentsByBooking] = useState<Record<string, PaymentRow[]>>({});
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: inv, error } = await supabase
        .from("invoices")
        .select("id, booking_id, invoice_number, subtotal, tax, total, currency, status, issued_at, paid_at, created_at")
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }
      const list = (inv ?? []) as InvoiceRow[];
      setInvoices(list);

      if (list.length === 0) {
        setLoading(false);
        return;
      }

      const ids = list.map((i) => i.booking_id);
      const [{ data: bs }, { data: ps }] = await Promise.all([
        supabase
          .from("bookings")
          .select("id, full_name, phone, email, address, category, service, area, preferred_date, preferred_time_slot, provider_id")
          .in("id", ids),
        supabase
          .from("payments")
          .select("id, booking_id, amount, method, gateway, gateway_ref, created_at")
          .in("booking_id", ids)
          .eq("status", "paid")
          .order("created_at", { ascending: true }),
      ]);

      const bMap: Record<string, BookingRow> = {};
      (bs ?? []).forEach((b) => (bMap[b.id] = b as BookingRow));
      setBookings(bMap);

      const pMap: Record<string, PaymentRow[]> = {};
      (ps ?? []).forEach((p) => {
        const arr = pMap[p.booking_id] ?? [];
        arr.push(p as PaymentRow);
        pMap[p.booking_id] = arr;
      });
      setPaymentsByBooking(pMap);

      const providerIds = Array.from(
        new Set((bs ?? []).map((b) => b.provider_id).filter(Boolean) as string[]),
      );
      if (providerIds.length > 0) {
        const { data: prov } = await supabase
          .from("profiles")
          .select("id, full_name, phone")
          .in("id", providerIds);
        const pMap2: Record<string, ProfileRow> = {};
        (prov ?? []).forEach((p) => (pMap2[p.id] = p as ProfileRow));
        setProviders(pMap2);
      }

      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  function handleDownload(inv: InvoiceRow) {
    const b = bookings[inv.booking_id];
    if (!b) return toast.error("Booking details unavailable");
    setDownloadingId(inv.id);
    try {
      const data: InvoicePdfData = {
        invoiceNumber: inv.invoice_number,
        issuedAt: inv.issued_at ?? inv.created_at,
        status: inv.status,
        currency: inv.currency,
        subtotal: Number(inv.subtotal),
        tax: Number(inv.tax),
        total: Number(inv.total),
        customer: {
          name: b.full_name,
          phone: b.phone,
          email: b.email,
          address: b.address,
        },
        booking: {
          id: b.id,
          category: b.category,
          service: b.service,
          area: b.area,
          preferredDate: b.preferred_date,
          preferredSlot: b.preferred_time_slot,
        },
        provider: b.provider_id
          ? {
              name: providers[b.provider_id]?.full_name ?? "Assigned provider",
              phone: providers[b.provider_id]?.phone,
            }
          : null,
        payments: (paymentsByBooking[b.id] ?? []).map((p) => ({
          method: p.method,
          gateway: p.gateway,
          amount: Number(p.amount),
          createdAt: p.created_at,
          ref: p.gateway_ref,
        })),
      };
      downloadInvoicePdf(data);
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <SiteShell>
      <div className="container-page py-6 md:py-10">
        <h1 className="mb-1 text-2xl font-bold tracking-tight md:text-3xl">Invoices</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Download receipts for your completed bookings.
        </p>

        {loading ? (
          <div className="flex items-center justify-center rounded-2xl border border-border bg-card py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <FileText className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">No invoices yet</p>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              Invoices appear here once your bookings are marked complete and a payment is recorded.
            </p>
            <Button asChild className="mt-4" size="sm">
              <Link to="/dashboard">Back to dashboard</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-hidden rounded-2xl border border-border bg-card md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((i) => {
                    const b = bookings[i.booking_id];
                    return (
                      <TableRow key={i.id}>
                        <TableCell className="font-mono text-xs">{i.invoice_number}</TableCell>
                        <TableCell className="text-sm">
                          {b ? `${b.category}${b.service ? " · " + b.service : ""}` : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(i.issued_at ?? i.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {fmt(Number(i.total), i.currency)}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusClass(i.status)}`}>
                            {i.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(i)}
                            disabled={downloadingId === i.id || !b}
                          >
                            <Download className="mr-1 h-3.5 w-3.5" /> PDF
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile list */}
            <ul className="space-y-3 md:hidden">
              {invoices.map((i) => {
                const b = bookings[i.booking_id];
                return (
                  <li key={i.id} className="rounded-2xl border border-border bg-card p-4">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-mono text-xs text-muted-foreground">
                          {i.invoice_number}
                        </div>
                        <div className="mt-1 truncate text-sm font-semibold text-foreground">
                          {b ? `${b.category}${b.service ? " · " + b.service : ""}` : "—"}
                        </div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {new Date(i.issued_at ?? i.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusClass(i.status)}`}>
                        {i.status}
                      </span>
                    </div>
                    <div className="mb-3 text-lg font-bold text-foreground">
                      {fmt(Number(i.total), i.currency)}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => handleDownload(i)}
                      disabled={downloadingId === i.id || !b}
                    >
                      <Download className="mr-1 h-3.5 w-3.5" /> Download PDF
                    </Button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </SiteShell>
  );
}
