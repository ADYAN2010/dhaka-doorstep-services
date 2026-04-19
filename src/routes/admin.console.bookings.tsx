import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/page-header";
import { SectionCard, StatusPill } from "@/components/admin/primitives";
import { EmptyState, ErrorState } from "@/components/admin/empty-state";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin/console/bookings")({
  component: BookingsPage,
});

type Booking = {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  category: string;
  service: string | null;
  area: string;
  preferred_date: string;
  preferred_time_slot: string;
  status: "new" | "confirmed" | "assigned" | "completed" | "cancelled";
  created_at: string;
};

const STATUSES = ["new", "confirmed", "assigned", "completed", "cancelled"] as const;

function BookingsPage() {
  const [rows, setRows] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  async function load() {
    setLoading(true);
    let q = supabase
      .from("bookings")
      .select("id, full_name, phone, email, category, service, area, preferred_date, preferred_time_slot, status, created_at")
      .order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("status", filter as Booking["status"]);
    const { data, error } = await q;
    if (error) setError(error.message);
    else setRows((data ?? []) as Booking[]);
    setLoading(false);
  }
  useEffect(() => { void load(); }, [filter]);

  async function setStatus(id: string, status: Booking["status"]) {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Marked ${status}`);
    void load();
  }

  return (
    <div>
      <AdminPageHeader
        eyebrow="Operations"
        title="Bookings"
        description="All bookings across the platform with status controls."
        breadcrumbs={[{ label: "Admin", to: "/admin/console" }, { label: "Bookings" }]}
        actions={
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Filter" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
            </SelectContent>
          </Select>
        }
      />
      <SectionCard padded={false}>
        {loading ? (
          <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : error ? (
          <div className="p-5"><ErrorState description={error} /></div>
        ) : rows.length === 0 ? (
          <div className="p-5"><EmptyState icon={CalendarCheck} title="No bookings" description="No bookings match your filter." /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Customer</th>
                  <th className="px-3 py-2 text-left">Service</th>
                  <th className="px-3 py-2 text-left">When</th>
                  <th className="px-3 py-2 text-left">Area</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-right">Update</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((b) => (
                  <tr key={b.id} className="border-t border-border">
                    <td className="px-3 py-2">
                      <div className="font-medium">{b.full_name}</div>
                      <div className="text-xs text-muted-foreground">{b.phone}</div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="capitalize">{b.category}</div>
                      {b.service && <div className="text-xs text-muted-foreground">{b.service}</div>}
                    </td>
                    <td className="px-3 py-2">
                      <div>{b.preferred_date}</div>
                      <div className="text-xs text-muted-foreground">{b.preferred_time_slot}</div>
                    </td>
                    <td className="px-3 py-2">{b.area}</td>
                    <td className="px-3 py-2">
                      <StatusPill
                        label={b.status}
                        tone={
                          b.status === "completed" ? "success"
                            : b.status === "cancelled" ? "danger"
                            : b.status === "assigned" ? "info"
                            : b.status === "confirmed" ? "primary"
                            : "warning"
                        }
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Select value={b.status} onValueChange={(v) => setStatus(b.id, v as Booking["status"])}>
                        <SelectTrigger className="ml-auto w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
