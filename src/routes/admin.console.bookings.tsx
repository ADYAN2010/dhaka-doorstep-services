import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarCheck, Loader2, Search, Filter, Phone, Mail, MapPin, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookingStatusBadge } from "@/components/admin-badges";

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
  budget_range: string | null;
  notes: string | null;
  status: "new" | "confirmed" | "assigned" | "completed" | "cancelled";
  created_at: string;
  provider_id: string | null;
};

const STATUSES = ["all", "new", "confirmed", "assigned", "completed", "cancelled"] as const;

function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<typeof STATUSES[number]>("all");
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) toast.error(error.message);
    else setBookings((data ?? []) as Booking[]);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  async function updateStatus(id: string, next: Booking["status"]) {
    setBusy(id);
    const { error } = await supabase.from("bookings").update({ status: next }).eq("id", id);
    setBusy(null);
    if (error) return toast.error(error.message);
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: next } : b)));
    toast.success(`Booking → ${next}`);
  }

  const filtered = bookings.filter((b) => {
    if (status !== "all" && b.status !== status) return false;
    if (!q) return true;
    const t = q.toLowerCase();
    return [b.full_name, b.phone, b.email, b.category, b.area, b.id].some((v) => v?.toLowerCase().includes(t));
  });

  const counts = STATUSES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = s === "all" ? bookings.length : bookings.filter((b) => b.status === s).length;
    return acc;
  }, {});

  return (
    <div>
      <AdminPageHeader
        eyebrow="Bookings"
        title="All bookings"
        description="Manage every booking across categories and areas. Filter, search, and move requests through their lifecycle."
        actions={<Button variant="outline" onClick={load} disabled={loading}>{loading && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}Refresh</Button>}
      />

      {/* Status pills */}
      <div className="mb-4 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
              status === s
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            {s} <span className="ml-1 opacity-70">({counts[s] ?? 0})</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, email, category…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Filter className="h-3.5 w-3.5" />
          {filtered.length} of {bookings.length}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title={loading ? "Loading bookings…" : q ? "No matches" : "No bookings"}
          description={!loading && !q ? "Bookings will appear here once customers submit requests." : undefined}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>When</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Update</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>
                      <div className="font-medium">{b.full_name}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{b.phone}</span>
                        {b.email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{b.email}</span>}
                        <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{b.area}</span>
                      </div>
                      {b.notes && (
                        <div className="mt-1 line-clamp-2 max-w-[320px] text-xs italic text-muted-foreground">
                          <MessageSquare className="mr-1 inline h-3 w-3" />{b.notes}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{b.category}</div>
                      {b.service && <div className="text-xs text-muted-foreground">{b.service}</div>}
                      {b.budget_range && <div className="mt-1 inline-flex rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">{b.budget_range}</div>}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{new Date(b.preferred_date).toLocaleDateString()}</div>
                      <div className="text-xs text-muted-foreground">{b.preferred_time_slot}</div>
                    </TableCell>
                    <TableCell><BookingStatusBadge status={b.status} /></TableCell>
                    <TableCell className="text-right">
                      <Select
                        value={b.status}
                        onValueChange={(v) => updateStatus(b.id, v as Booking["status"])}
                        disabled={busy === b.id}
                      >
                        <SelectTrigger className="h-8 w-[140px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="assigned">Assigned</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
