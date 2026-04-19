import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity, CalendarCheck, Briefcase, Inbox, Users,
  IdCard, Mail, Wallet, Star, Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/page-header";
import { StatTile, SectionCard } from "@/components/admin/primitives";
import { EmptyState, ErrorState } from "@/components/admin/empty-state";

export const Route = createFileRoute("/admin/console/overview")({
  component: OverviewPage,
});

type Stats = {
  bookingsTotal: number;
  bookingsNew: number;
  bookingsCompleted: number;
  providers: number;
  customers: number;
  applicationsNew: number;
  contactNew: number;
  reviews: number;
};

type RecentBooking = {
  id: string;
  full_name: string;
  category: string;
  area: string;
  status: string;
  created_at: string;
};

function OverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<RecentBooking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [
          bTotal, bNew, bDone, providers, customers, appsNew, contactNew, reviews, recentRows,
        ] = await Promise.all([
          supabase.from("bookings").select("id", { count: "exact", head: true }),
          supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "new"),
          supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "completed"),
          supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "provider"),
          supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "customer"),
          supabase.from("provider_applications").select("id", { count: "exact", head: true }).eq("status", "new"),
          supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("handled", false),
          supabase.from("reviews").select("id", { count: "exact", head: true }),
          supabase
            .from("bookings")
            .select("id, full_name, category, area, status, created_at")
            .order("created_at", { ascending: false })
            .limit(8),
        ]);
        setStats({
          bookingsTotal: bTotal.count ?? 0,
          bookingsNew: bNew.count ?? 0,
          bookingsCompleted: bDone.count ?? 0,
          providers: providers.count ?? 0,
          customers: customers.count ?? 0,
          applicationsNew: appsNew.count ?? 0,
          contactNew: contactNew.count ?? 0,
          reviews: reviews.count ?? 0,
        });
        setRecent((recentRows.data ?? []) as RecentBooking[]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load overview");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (error) return <ErrorState description={error} />;

  return (
    <div>
      <AdminPageHeader
        eyebrow="Workspace"
        title="Overview"
        description="A live snapshot of bookings, applications, messages, and the team."
        breadcrumbs={[{ label: "Admin", to: "/admin/console" }, { label: "Overview" }]}
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatTile icon={CalendarCheck} label="Bookings" value={stats?.bookingsTotal ?? 0} hint={`${stats?.bookingsNew ?? 0} new`} tone="primary" />
        <StatTile icon={Activity} label="Completed" value={stats?.bookingsCompleted ?? 0} tone="success" />
        <StatTile icon={Briefcase} label="Providers" value={stats?.providers ?? 0} tone="info" />
        <StatTile icon={Users} label="Customers" value={stats?.customers ?? 0} />
        <StatTile icon={IdCard} label="Applications" value={stats?.applicationsNew ?? 0} hint="New" tone="warning" />
        <StatTile icon={Mail} label="Contact inbox" value={stats?.contactNew ?? 0} hint="Unhandled" tone="warning" />
        <StatTile icon={Star} label="Reviews" value={stats?.reviews ?? 0} />
        <StatTile icon={Wallet} label="Pending payouts" value={0} hint="Coming soon" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <SectionCard className="lg:col-span-2" title="Recent bookings" icon={CalendarCheck} description="Latest 8 bookings across the platform.">
          {recent.length === 0 ? (
            <EmptyState icon={Inbox} title="No bookings yet" description="When customers book a service, they'll appear here." />
          ) : (
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">Customer</th>
                    <th className="px-3 py-2 text-left">Category</th>
                    <th className="px-3 py-2 text-left">Area</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">When</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((b) => (
                    <tr key={b.id} className="border-t border-border">
                      <td className="px-3 py-2">{b.full_name}</td>
                      <td className="px-3 py-2 capitalize">{b.category}</td>
                      <td className="px-3 py-2">{b.area}</td>
                      <td className="px-3 py-2 capitalize">{b.status}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {new Date(b.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Quick links" icon={Activity}>
          <ul className="space-y-2 text-sm">
            <li><Link to="/admin/console/bookings" className="text-primary hover:underline">Manage bookings →</Link></li>
            <li><Link to="/admin/console/applications" className="text-primary hover:underline">Review provider applications →</Link></li>
            <li><Link to="/admin/console/providers" className="text-primary hover:underline">Provider directory →</Link></li>
            <li><Link to="/admin/console/customers" className="text-primary hover:underline">Customer directory →</Link></li>
            <li><Link to="/admin/console/services" className="text-primary hover:underline">Service categories →</Link></li>
            <li><Link to="/admin/console/messages" className="text-primary hover:underline">Contact messages →</Link></li>
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}
