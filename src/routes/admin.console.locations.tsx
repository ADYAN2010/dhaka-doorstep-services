import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/page-header";
import { SectionCard } from "@/components/admin/primitives";
import { EmptyState, ErrorState } from "@/components/admin/empty-state";

export const Route = createFileRoute("/admin/console/locations")({
  component: LocationsPage,
});

type Zone = { id: string; name: string; pricing_modifier: number; is_active: boolean; city_id: string };
type City = { id: string; name: string };

function LocationsPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [z, c] = await Promise.all([
        supabase.from("zones").select("id, name, pricing_modifier, is_active, city_id").order("name"),
        supabase.from("cities").select("id, name").order("name"),
      ]);
      if (z.error) setError(z.error.message);
      else setZones((z.data ?? []) as Zone[]);
      if (c.data) setCities(c.data as City[]);
      setLoading(false);
    })();
  }, []);

  const cityName = (id: string) => cities.find((c) => c.id === id)?.name ?? "—";

  return (
    <div>
      <AdminPageHeader
        eyebrow="Locations"
        title="Coverage zones"
        description="Service zones grouped by city, with pricing modifiers."
        breadcrumbs={[{ label: "Admin", to: "/admin/console" }, { label: "Locations" }]}
        actions={<Link to="/admin/console/cities" className="text-sm text-primary hover:underline">Manage cities →</Link>}
      />
      <SectionCard padded={false}>
        {loading ? (
          <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : error ? (
          <div className="p-5"><ErrorState description={error} /></div>
        ) : zones.length === 0 ? (
          <div className="p-5"><EmptyState icon={MapPin} title="No zones" description="Add zones in the database to populate this list." /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Zone</th>
                  <th className="px-3 py-2 text-left">City</th>
                  <th className="px-3 py-2 text-left">Pricing modifier</th>
                  <th className="px-3 py-2 text-left">Active</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((z) => (
                  <tr key={z.id} className="border-t border-border">
                    <td className="px-3 py-2 font-medium">{z.name}</td>
                    <td className="px-3 py-2">{cityName(z.city_id)}</td>
                    <td className="px-3 py-2">×{Number(z.pricing_modifier).toFixed(2)}</td>
                    <td className="px-3 py-2">{z.is_active ? "Yes" : "No"}</td>
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
