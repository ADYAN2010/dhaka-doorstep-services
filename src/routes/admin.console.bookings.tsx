/**
 * Admin → Bookings
 * Calls GET /api/bookings (admin auth required).
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck, Loader2, Search, Filter, Phone, Mail, MapPin, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import { bookingsApi, type AdminBooking, type BookingStatus } from "@/lib/admin-api";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { BookingStatusBadge } from "@/components/admin-badges";

export const Route = createFileRoute("/admin/console/bookings")({
  component: BookingsPage,
});

const STATUSES = ["all", "new", "confirmed", "assigned", "completed", "cancelled"] as const;
type StatusFilter = (typeof STATUSES)[number];

function BookingsPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    bookingsApi
      .list({ q: q || undefined, limit: 200 })
      .then((res) => {
        if (cancelled) return;
        setBookings(res.data ?? []);
        setTotal(res.total ?? 0);
      })
      .catch((e) => {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 401) {
          return navigate({ to: "/admin/backend/login" });
        }
        toast.error(e instanceof Error ? e.message : "Failed to load bookings");
      })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [navigate, q, tick]);

  const filtered = useMemo(() => {
    if (status === "all") return bookings;
    return bookings.filter((b) => b.status === (status as BookingStatus));
  }, [bookings, status]);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Bookings"
        title="All bookings"
        description="Every booking from /api/bookings — filter by status and search by customer, phone, category, or area."
        actions={
          <Button variant="outline" onClick={() => setTick((t) => t + 1)} disabled={loading}>
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

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
            {s}
          </button>
        ))}
      </div>

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
          {filtered.length} of {total}
        </div>
      </div>

      {loading ? (
        <div className="grid place-items-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title={q || status !== "all" ? "No matches" : "No bookings"}
          description={!q && status === "all" ? "Bookings will appear here once customers submit requests." : undefined}
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
                  <TableHead className="text-xs text-muted-foreground">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>
                      <div className="font-medium">{b.full_name}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {b.phone}
                        </span>
                        {b.email && (
                          <span className="inline-flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {b.email}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 capitalize">
                          <MapPin className="h-3 w-3" />
                          {b.area}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm capitalize">{b.category}</div>
                      {b.service && <div className="text-xs text-muted-foreground">{b.service}</div>}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{new Date(b.preferred_date).toLocaleDateString()}</div>
                      <div className="text-xs text-muted-foreground">{b.preferred_time_slot}</div>
                    </TableCell>
                    <TableCell><BookingStatusBadge status={b.status} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(b.created_at).toLocaleDateString()}
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
