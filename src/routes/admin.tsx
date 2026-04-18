import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Shield, Check, X, UserPlus, UserMinus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({
    meta: [
      { title: "Admin · Shebabd" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

type AppRole = "customer" | "provider" | "admin";
type ProviderStatus = "not_applicable" | "pending" | "approved" | "rejected";
type BookingStatus = "new" | "confirmed" | "assigned" | "completed" | "cancelled";
type ApplicationStatus = "new" | "reviewing" | "approved" | "rejected";

type ProviderRow = {
  id: string;
  full_name: string;
  phone: string | null;
  area: string | null;
  provider_status: ProviderStatus;
  created_at: string;
};

type RoleRow = {
  user_id: string;
  role: AppRole;
  full_name: string | null;
};

type BookingRow = {
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
  status: BookingStatus;
  created_at: string;
};

type ApplicationRow = {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  category: string;
  experience: string;
  coverage_area: string;
  applicant_type: string;
  about: string | null;
  status: ApplicationStatus;
  created_at: string;
};

function AdminPage() {
  const { user, roles, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const isAdmin = roles.includes("admin");

  const [adminExists, setAdminExists] = useState<boolean | null>(null);
  const [claiming, setClaiming] = useState(false);

  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [roleRows, setRoleRows] = useState<RoleRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"pending" | "all">("pending");
  const [busyRowId, setBusyRowId] = useState<string | null>(null);

  // Detect whether any admin exists (for bootstrap UX).
  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    (async () => {
      const { count, error } = await supabase
        .from("user_roles")
        .select("user_id", { count: "exact", head: true })
        .eq("role", "admin");
      if (cancelled) return;
      if (error) {
        // RLS may block this for non-admins; treat as "exists" so we hide the bootstrap.
        setAdminExists(true);
      } else {
        setAdminExists((count ?? 0) > 0);
      }
    })();
    return () => {
      cancelled = false;
    };
  }, [authLoading, roles]);

  // Load admin data once we know the user is admin.
  useEffect(() => {
    if (!isAdmin) return;
    void refresh();
  }, [isAdmin]);

  async function refresh() {
    setLoadingData(true);
    const [prov, rolesRes, profilesRes, bookingsRes, appsRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, phone, area, provider_status, created_at")
        .order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("profiles").select("id, full_name"),
      supabase
        .from("bookings")
        .select("id, full_name, phone, email, category, service, area, preferred_date, preferred_time_slot, budget_range, notes, status, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("provider_applications")
        .select("id, full_name, phone, email, category, experience, coverage_area, applicant_type, about, status, created_at")
        .order("created_at", { ascending: false }),
    ]);

    if (prov.error) toast.error(prov.error.message);
    else setProviders((prov.data ?? []) as ProviderRow[]);

    if (bookingsRes.error) toast.error(bookingsRes.error.message);
    else setBookings((bookingsRes.data ?? []) as BookingRow[]);

    if (appsRes.error) toast.error(appsRes.error.message);
    else setApplications((appsRes.data ?? []) as ApplicationRow[]);

    if (rolesRes.error || profilesRes.error) {
      toast.error(rolesRes.error?.message ?? profilesRes.error?.message ?? "Load failed");
    } else {
      const nameById = new Map<string, string>();
      (profilesRes.data ?? []).forEach((p) => nameById.set(p.id, p.full_name));
      setRoleRows(
        (rolesRes.data ?? []).map((r) => ({
          user_id: r.user_id,
          role: r.role as AppRole,
          full_name: nameById.get(r.user_id) ?? null,
        })),
      );
    }
    setLoadingData(false);
  }

  async function updateBookingStatus(id: string, status: BookingStatus) {
    setBusyRowId(id);
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    setBusyRowId(null);
    if (error) return toast.error(error.message);
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
    toast.success(`Booking ${status}`);
  }

  async function updateApplicationStatus(id: string, status: ApplicationStatus) {
    setBusyRowId(id);
    const { error } = await supabase
      .from("provider_applications")
      .update({ status })
      .eq("id", id);
    setBusyRowId(null);
    if (error) return toast.error(error.message);
    setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    toast.success(`Application ${status}`);
  }

  async function handleClaim() {
    setClaiming(true);
    const { data, error } = await supabase.rpc("claim_first_admin");
    setClaiming(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data === true) {
      toast.success("You are now an admin. Reloading…");
      // Force refresh of session/roles.
      window.location.reload();
    } else {
      toast.error("An admin already exists. Ask them to grant you access.");
      setAdminExists(true);
    }
  }

  async function setStatus(userId: string, status: ProviderStatus) {
    setBusyUserId(userId);
    const { error } = await supabase.rpc("set_provider_status", {
      _user_id: userId,
      _status: status,
    });
    setBusyUserId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Provider ${status}`);
    setProviders((prev) =>
      prev.map((p) => (p.id === userId ? { ...p, provider_status: status } : p)),
    );
  }

  async function grantRole(userId: string, role: AppRole) {
    setBusyUserId(userId);
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role });
    setBusyUserId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Granted ${role}`);
    void refresh();
  }

  async function revokeRole(userId: string, role: AppRole) {
    if (role === "admin" && user?.id === userId) {
      toast.error("You can't revoke your own admin role.");
      return;
    }
    setBusyUserId(userId);
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", role);
    setBusyUserId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Revoked ${role}`);
    void refresh();
  }

  const filteredProviders = useMemo(() => {
    if (statusFilter === "pending") {
      return providers.filter((p) => p.provider_status === "pending");
    }
    return providers.filter((p) => p.provider_status !== "not_applicable");
  }, [providers, statusFilter]);

  const rolesByUser = useMemo(() => {
    const m = new Map<string, { name: string | null; roles: AppRole[] }>();
    roleRows.forEach((r) => {
      const cur = m.get(r.user_id) ?? { name: r.full_name, roles: [] };
      cur.roles.push(r.role);
      cur.name = cur.name ?? r.full_name;
      m.set(r.user_id, cur);
    });
    return Array.from(m.entries()).sort((a, b) =>
      (a[1].name ?? "").localeCompare(b[1].name ?? ""),
    );
  }, [roleRows]);

  // ---------- Render ----------
  if (authLoading) {
    return (
      <div className="container-page py-24 text-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="text-2xl font-bold">Admin</h1>
        <p className="mt-2 text-muted-foreground">Please sign in to continue.</p>
        <Button className="mt-6" onClick={() => navigate({ to: "/login" })}>
          Log in
        </Button>
      </div>
    );
  }

  // Not an admin yet — show bootstrap or "request access".
  if (!isAdmin) {
    return (
      <div className="container-page max-w-xl py-20">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-soft">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
              <Shield className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold">Admin access</h1>
          </div>

          {adminExists === null ? (
            <p className="mt-6 text-muted-foreground">Checking admin state…</p>
          ) : adminExists ? (
            <>
              <p className="mt-6 text-muted-foreground">
                You don't have admin permissions. Ask an existing admin to grant you the
                <span className="font-medium text-foreground"> admin</span> role.
              </p>
              <Link
                to="/"
                className="mt-6 inline-flex rounded-full bg-muted px-4 py-2 text-sm font-medium"
              >
                Back to home
              </Link>
            </>
          ) : (
            <>
              <p className="mt-6 text-muted-foreground">
                No admin exists yet. As the first signed-in user to claim it, you'll
                become the platform administrator. This can only be done once.
              </p>
              <Button className="mt-6" onClick={handleClaim} disabled={claiming}>
                {claiming ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Claim first admin
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Admin view
  return (
    <div className="container-page py-10">
      <header className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4 text-primary" /> Admin panel
          </div>
          <h1 className="mt-1 text-3xl font-bold">Moderation & roles</h1>
        </div>
        <Button variant="outline" onClick={refresh} disabled={loadingData}>
          {loadingData ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Refresh
        </Button>
      </header>

      {/* Provider applications */}
      <section className="mt-10 rounded-3xl border border-border bg-card p-6 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Provider applications</h2>
          <div className="flex rounded-full border border-border bg-background p-1 text-sm">
            {(["pending", "all"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setStatusFilter(k)}
                className={`rounded-full px-3 py-1 capitalize ${
                  statusFilter === k
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Area</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProviders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    {loadingData ? "Loading…" : "No applications"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredProviders.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.full_name || "—"}</TableCell>
                    <TableCell className="capitalize">{p.area ?? "—"}</TableCell>
                    <TableCell>{p.phone ?? "—"}</TableCell>
                    <TableCell>
                      <StatusBadge status={p.provider_status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setStatus(p.id, "approved")}
                          disabled={busyUserId === p.id || p.provider_status === "approved"}
                        >
                          <Check className="h-4 w-4" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setStatus(p.id, "rejected")}
                          disabled={busyUserId === p.id || p.provider_status === "rejected"}
                        >
                          <X className="h-4 w-4" /> Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Bookings */}
      <section className="mt-10 rounded-3xl border border-border bg-card p-6 shadow-soft">
        <h2 className="text-xl font-semibold">Bookings</h2>
        <p className="mt-1 text-sm text-muted-foreground">All customer service requests.</p>

        <div className="mt-4 overflow-hidden rounded-2xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Area</TableHead>
                <TableHead>When</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    {loadingData ? "Loading…" : "No bookings yet"}
                  </TableCell>
                </TableRow>
              ) : (
                bookings.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>
                      <div className="font-medium">{b.full_name}</div>
                      <div className="text-xs text-muted-foreground">{b.phone}</div>
                    </TableCell>
                    <TableCell>
                      <div className="capitalize">{b.category}</div>
                      {b.service && <div className="text-xs text-muted-foreground">{b.service}</div>}
                    </TableCell>
                    <TableCell className="capitalize">{b.area}</TableCell>
                    <TableCell className="text-xs">
                      {b.preferred_date}
                      <div className="text-muted-foreground">{b.preferred_time_slot}</div>
                    </TableCell>
                    <TableCell><BookingStatusBadge status={b.status} /></TableCell>
                    <TableCell className="text-right">
                      <select
                        className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                        value={b.status}
                        disabled={busyRowId === b.id}
                        onChange={(e) => updateBookingStatus(b.id, e.target.value as BookingStatus)}
                      >
                        {(["new", "confirmed", "assigned", "completed", "cancelled"] as const).map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Provider applications (form submissions) */}
      <section className="mt-10 rounded-3xl border border-border bg-card p-6 shadow-soft">
        <h2 className="text-xl font-semibold">Provider applications (form)</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Submissions from the “Become a provider” form.
        </p>

        <div className="mt-4 overflow-hidden rounded-2xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Area</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    {loadingData ? "Loading…" : "No applications yet"}
                  </TableCell>
                </TableRow>
              ) : (
                applications.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <div className="font-medium">{a.full_name}</div>
                      <div className="text-xs text-muted-foreground">{a.email} · {a.phone}</div>
                    </TableCell>
                    <TableCell className="capitalize">{a.category}</TableCell>
                    <TableCell className="capitalize">{a.coverage_area}</TableCell>
                    <TableCell className="text-xs">{a.experience}</TableCell>
                    <TableCell><AppStatusBadge status={a.status} /></TableCell>
                    <TableCell className="text-right">
                      <select
                        className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                        value={a.status}
                        disabled={busyRowId === a.id}
                        onChange={(e) => updateApplicationStatus(a.id, e.target.value as ApplicationStatus)}
                      >
                        {(["new", "reviewing", "approved", "rejected"] as const).map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Roles */}
      <section className="mt-10 rounded-3xl border border-border bg-card p-6 shadow-soft">
        <h2 className="text-xl font-semibold">Roles</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Grant or revoke roles. Admins have full access.
        </p>

        <div className="mt-4 overflow-hidden rounded-2xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead className="text-right">Manage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rolesByUser.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                    {loadingData ? "Loading…" : "No users"}
                  </TableCell>
                </TableRow>
              ) : (
                rolesByUser.map(([userId, info]) => {
                  const all: AppRole[] = ["customer", "provider", "admin"];
                  return (
                    <TableRow key={userId}>
                      <TableCell>
                        <div className="font-medium">{info.name || "—"}</div>
                        <div className="text-xs text-muted-foreground">{userId.slice(0, 8)}…</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {info.roles.map((r) => (
                            <span
                              key={r}
                              className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium capitalize"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex flex-wrap justify-end gap-2">
                          {all.map((r) => {
                            const has = info.roles.includes(r);
                            return (
                              <Button
                                key={r}
                                size="sm"
                                variant="outline"
                                disabled={busyUserId === userId}
                                onClick={() =>
                                  has ? revokeRole(userId, r) : grantRole(userId, r)
                                }
                              >
                                {has ? (
                                  <UserMinus className="h-4 w-4" />
                                ) : (
                                  <UserPlus className="h-4 w-4" />
                                )}
                                {has ? "Revoke" : "Grant"} {r}
                              </Button>
                            );
                          })}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: ProviderStatus }) {
  const map: Record<ProviderStatus, string> = {
    pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    approved: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    rejected: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
    not_applicable: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${map[status]}`}>
      {status.replace("_", " ")}
    </span>
  );
}

function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const map: Record<BookingStatus, string> = {
    new: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
    confirmed: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    assigned: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
    completed: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    cancelled: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${map[status]}`}>
      {status}
    </span>
  );
}

function AppStatusBadge({ status }: { status: ApplicationStatus }) {
  const map: Record<ApplicationStatus, string> = {
    new: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
    reviewing: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    approved: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    rejected: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${map[status]}`}>
      {status}
    </span>
  );
}
