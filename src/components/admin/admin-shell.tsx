import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Activity, Users, Briefcase, CalendarCheck, Tag, MapPin,
  Wallet, Star, Inbox, Megaphone, FileText, BarChart3, ShieldCheck,
  Palette, Settings, Lock, ChevronLeft, ChevronRight, Search, Bell,
  Plus, LogOut, User as UserIcon, Menu, ExternalLink, Sparkles,
  Globe, Layers, Bell as BellIcon, Boxes, IdCard, Award, UserCog,
  Workflow, Receipt, Ticket, Plug, Webhook, KeyRound, FileLock2,
  History, MessageSquareText, Map, Building2, Image, Sliders, BadgeCheck,
  Megaphone as MegaphoneIcon, Mail, Network, ShieldAlert,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import { toast } from "sonner";

export type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: number | null;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const ADMIN_NAV: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      { to: "/admin/console/overview", label: "Overview", icon: LayoutDashboard },
      { to: "/admin/console/operations", label: "Live operations", icon: Activity },
      { to: "/admin/console/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Website",
    items: [
      { to: "/admin/console/website", label: "Site identity", icon: Globe },
      { to: "/admin/console/pages", label: "Static pages", icon: FileText },
      { to: "/admin/console/faqs", label: "FAQs", icon: MessageSquareText },
      { to: "/admin/console/blog", label: "Blog", icon: FileText },
      { to: "/admin/console/popups", label: "Popups & banners", icon: Image },
      { to: "/admin/console/navigation", label: "Navigation & footer", icon: Layers },
      { to: "/admin/console/appearance", label: "Theme & branding", icon: Palette },
    ],
  },
  {
    label: "Marketplace",
    items: [
      { to: "/admin/console/services", label: "Categories", icon: Tag },
      { to: "/admin/console/subcategories", label: "Service templates", icon: Boxes },
      { to: "/admin/console/featured", label: "Featured services", icon: Sparkles },
      { to: "/admin/console/providers", label: "Providers", icon: Briefcase },
      { to: "/admin/console/kyc", label: "KYC & verification", icon: IdCard },
      { to: "/admin/console/provider-quality", label: "Quality & contracts", icon: Award },
      { to: "/admin/console/customers", label: "Customers", icon: Users },
      { to: "/admin/console/customer-segments", label: "Segments & VIPs", icon: UserCog },
      { to: "/admin/console/applications", label: "Provider applications", icon: IdCard },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/admin/console/bookings", label: "Bookings", icon: CalendarCheck },
      { to: "/admin/console/ops-rules", label: "Booking rules", icon: Workflow },
      { to: "/admin/console/disputes", label: "Disputes", icon: ShieldAlert },
      { to: "/admin/console/reviews", label: "Reviews", icon: Star },
    ],
  },
  {
    label: "Finance",
    items: [
      { to: "/admin/console/finance", label: "Finance overview", icon: Wallet },
      { to: "/admin/console/finance-rules", label: "Commission & fees", icon: Receipt },
      { to: "/admin/console/coupons", label: "Coupons", icon: Tag },
    ],
  },
  {
    label: "Growth",
    items: [
      { to: "/admin/console/marketing", label: "Campaigns", icon: Megaphone },
      { to: "/admin/console/leads", label: "Leads CRM", icon: MegaphoneIcon },
      { to: "/admin/console/notifications", label: "Notification templates", icon: Mail },
    ],
  },
  {
    label: "Support",
    items: [
      { to: "/admin/console/support", label: "Support inbox", icon: Inbox },
      { to: "/admin/console/messages", label: "Contact messages", icon: Mail },
      { to: "/admin/console/ticket-categories", label: "Ticket categories", icon: Ticket },
      { to: "/admin/console/trust-badges", label: "Trust & safety", icon: BadgeCheck },
    ],
  },
  {
    label: "Locations",
    items: [
      { to: "/admin/console/cities", label: "Cities", icon: Building2 },
      { to: "/admin/console/zones", label: "Zones & areas", icon: Map },
      { to: "/admin/console/locations", label: "Coverage map", icon: MapPin },
    ],
  },
  {
    label: "Team",
    items: [
      { to: "/admin/console/team", label: "Members", icon: Users },
      { to: "/admin/console/roles", label: "Roles & permissions", icon: ShieldCheck },
      { to: "/admin/console/activity", label: "Activity timeline", icon: History },
    ],
  },
  {
    label: "Compliance & system",
    items: [
      { to: "/admin/console/integrations", label: "Integrations", icon: Plug },
      { to: "/admin/console/webhooks", label: "Webhooks", icon: Webhook },
      { to: "/admin/console/api-keys", label: "API keys", icon: KeyRound },
      { to: "/admin/console/security", label: "Security policy", icon: Lock },
      { to: "/admin/console/login-audit", label: "Login audit", icon: Network },
      { to: "/admin/console/data-requests", label: "Data requests", icon: FileLock2 },
      { to: "/admin/console/system-status", label: "System status", icon: Activity },
      { to: "/admin/console/settings", label: "Account settings", icon: Settings },
    ],
  },
];

type Counts = {
  newApplications: number;
  newBookings: number;
  unreadMessages: number;
  pendingPayouts: number;
};

export function AdminShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [counts, setCounts] = useState<Counts>({
    newApplications: 0, newBookings: 0, unreadMessages: 0, pendingPayouts: 0,
  });
  const [profile, setProfile] = useState<{ full_name: string | null; avatar_url: string | null } | null>(null);

  // Notification counts — placeholder. Admin badge counters will be wired
  // to Supabase aggregations in a follow-up; they stay at 0 until then.

  // Profile is read straight off the auth user (full_name / email).
  useEffect(() => {
    if (!user) return;
    setProfile({
      full_name: (user as { full_name?: string | null }).full_name ?? null,
      avatar_url: null,
    });
  }, [user]);

  // CMD+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const totalNotifications = counts.newApplications + counts.newBookings + counts.unreadMessages + counts.pendingPayouts;

  const navWithBadges = useMemo(() => {
    return ADMIN_NAV.map((group) => ({
      ...group,
      items: group.items.map((item) => {
        let badge: number | null = null;
        if (item.to === "/admin/console/providers") badge = counts.newApplications || null;
        if (item.to === "/admin/console/bookings") badge = counts.newBookings || null;
        if (item.to === "/admin/console/support") badge = counts.unreadMessages || null;
        if (item.to === "/admin/console/finance") badge = counts.pendingPayouts || null;
        return { ...item, badge };
      }),
    }));
  }, [counts]);

  const initials = (profile?.full_name ?? user?.email ?? "A").split(" ").map((s) => s[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/login" });
  }

  return (
    <div className="flex min-h-screen bg-surface text-foreground">
      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          type="button"
          aria-hidden
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${collapsed ? "w-[72px]" : "w-[260px]"} ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-card shadow-elevated transition-all duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0`}
      >
        {/* Brand */}
        <div className={`flex h-16 items-center border-b border-border px-4 ${collapsed ? "justify-center" : "justify-between"}`}>
          {collapsed ? (
            <Link to="/admin/console" className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary text-primary-foreground">
              <ShieldCheck className="h-5 w-5" />
            </Link>
          ) : (
            <Link to="/admin/console" className="flex items-center gap-2">
              <Logo />
              <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                Admin
              </span>
            </Link>
          )}
          <button
            type="button"
            className="hidden h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted lg:inline-flex"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {navWithBadges.map((group) => (
            <div key={group.label} className="mb-5">
              {!collapsed && (
                <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                  {group.label}
                </div>
              )}
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.to || pathname.startsWith(item.to + "/");
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        onClick={() => setMobileOpen(false)}
                        title={collapsed ? item.label : undefined}
                        className={`group relative flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm transition-colors ${
                          isActive
                            ? "bg-primary/10 font-semibold text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        } ${collapsed ? "justify-center" : ""}`}
                      >
                        <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : ""}`} />
                        {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                        {!collapsed && item.badge ? (
                          <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                            {item.badge > 99 ? "99+" : item.badge}
                          </span>
                        ) : null}
                        {collapsed && item.badge ? (
                          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" />
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer link to public site */}
        <div className="border-t border-border p-3">
          <Link
            to="/"
            className={`flex items-center gap-2 rounded-lg px-2 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground ${
              collapsed ? "justify-center" : ""
            }`}
            title="Back to public site"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {!collapsed && <span>Public site</span>}
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur md:px-6">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>

          {/* Global search trigger */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground hover:bg-muted md:max-w-md"
          >
            <Search className="h-4 w-4" />
            <span className="flex-1 truncate text-left">Search bookings, customers, providers…</span>
            <kbd className="hidden rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium md:inline">
              ⌘K
            </kbd>
          </button>

          <div className="ml-auto flex items-center gap-1.5">
            {/* Quick actions */}
            <div className="relative">
              <Button
                size="sm"
                onClick={() => setQuickOpen((v) => !v)}
                className="hidden bg-gradient-primary text-primary-foreground shadow-soft hover:opacity-90 md:inline-flex"
              >
                <Plus className="h-4 w-4" />
                Quick action
              </Button>
              <Button
                size="icon"
                onClick={() => setQuickOpen((v) => !v)}
                className="bg-gradient-primary text-primary-foreground md:hidden"
                aria-label="Quick action"
              >
                <Plus className="h-4 w-4" />
              </Button>
              {quickOpen && (
                <>
                  <button type="button" aria-hidden className="fixed inset-0 z-40" onClick={() => setQuickOpen(false)} />
                  <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-border bg-popover p-1 shadow-elevated">
                    <QuickItem onClick={() => { setQuickOpen(false); navigate({ to: "/admin/console/content" }); }} icon={FileText} label="New blog post" />
                    <QuickItem onClick={() => { setQuickOpen(false); navigate({ to: "/admin/console/services" }); }} icon={Tag} label="New service category" />
                    <QuickItem onClick={() => { setQuickOpen(false); navigate({ to: "/admin/console/team" }); }} icon={ShieldCheck} label="Invite team member" />
                    <QuickItem onClick={() => { setQuickOpen(false); navigate({ to: "/book" }); }} icon={CalendarCheck} label="Create booking" />
                    <QuickItem onClick={() => { setQuickOpen(false); navigate({ to: "/admin/console/marketing" }); }} icon={Megaphone} label="New campaign" />
                  </div>
                </>
              )}
            </div>

            <ThemeToggle />

            {/* Notifications */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((v) => !v)}
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                {totalNotifications > 0 && (
                  <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground ring-2 ring-background">
                    {totalNotifications > 9 ? "9+" : totalNotifications}
                  </span>
                )}
              </button>
              {notifOpen && (
                <>
                  <button type="button" aria-hidden className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                  <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-border bg-popover shadow-elevated">
                    <div className="flex items-center justify-between border-b border-border px-4 py-3">
                      <div className="text-sm font-semibold">Notifications</div>
                      {totalNotifications === 0 ? (
                        <span className="text-xs text-muted-foreground">All caught up</span>
                      ) : (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                          {totalNotifications} new
                        </span>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto p-1">
                      <NotifRow
                        show={counts.newApplications > 0}
                        icon={Briefcase}
                        title={`${counts.newApplications} new provider application${counts.newApplications === 1 ? "" : "s"}`}
                        sub="Awaiting your review"
                        onClick={() => { setNotifOpen(false); navigate({ to: "/admin/console/providers" }); }}
                      />
                      <NotifRow
                        show={counts.newBookings > 0}
                        icon={CalendarCheck}
                        title={`${counts.newBookings} unassigned booking${counts.newBookings === 1 ? "" : "s"}`}
                        sub="Need a provider"
                        onClick={() => { setNotifOpen(false); navigate({ to: "/admin/console/bookings" }); }}
                      />
                      <NotifRow
                        show={counts.unreadMessages > 0}
                        icon={Inbox}
                        title={`${counts.unreadMessages} support message${counts.unreadMessages === 1 ? "" : "s"}`}
                        sub="Unhandled inquiries"
                        onClick={() => { setNotifOpen(false); navigate({ to: "/admin/console/support" }); }}
                      />
                      <NotifRow
                        show={counts.pendingPayouts > 0}
                        icon={Wallet}
                        title={`${counts.pendingPayouts} pending payout${counts.pendingPayouts === 1 ? "" : "s"}`}
                        sub="Provider earnings owed"
                        onClick={() => { setNotifOpen(false); navigate({ to: "/admin/console/finance" }); }}
                      />
                      {totalNotifications === 0 && (
                        <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                          <Sparkles className="mx-auto mb-2 h-6 w-6 text-primary/60" />
                          You're all caught up.
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((v) => !v)}
                className="flex items-center gap-2 rounded-lg border border-border bg-background py-1 pl-1 pr-2.5 text-sm hover:bg-muted"
                aria-label="Profile menu"
              >
                <span className="grid h-7 w-7 place-items-center overflow-hidden rounded-md bg-gradient-primary text-xs font-bold text-primary-foreground">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initials || "A"
                  )}
                </span>
                <span className="hidden max-w-[120px] truncate text-xs font-medium md:inline">
                  {profile?.full_name?.split(" ")[0] ?? "Admin"}
                </span>
              </button>
              {profileOpen && (
                <>
                  <button type="button" aria-hidden className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-border bg-popover p-1 shadow-elevated">
                    <div className="flex items-center gap-3 px-3 py-3">
                      <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-lg bg-gradient-primary text-sm font-bold text-primary-foreground">
                        {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" /> : initials || "A"}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">{profile?.full_name ?? "Admin"}</div>
                        <div className="truncate text-xs text-muted-foreground">{user?.email}</div>
                      </div>
                    </div>
                    <div className="my-1 h-px bg-border" />
                    <Link to="/admin/console/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted">
                      <UserIcon className="h-4 w-4" /> Account settings
                    </Link>
                    <Link to="/admin/console/security" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted">
                      <Lock className="h-4 w-4" /> Security
                    </Link>
                    <Link to="/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted">
                      <ExternalLink className="h-4 w-4" /> Public profile
                    </Link>
                    <div className="my-1 h-px bg-border" />
                    <button
                      type="button"
                      onClick={() => { setProfileOpen(false); void handleSignOut(); }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page body */}
        <main className="min-h-0 flex-1 px-4 py-6 md:px-6 md:py-8">{children}</main>
      </div>

      {/* Global search dialog */}
      <GlobalSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}

function QuickItem({ icon: Icon, label, onClick }: { icon: typeof Plus; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
    >
      <Icon className="h-4 w-4 text-muted-foreground" /> {label}
    </button>
  );
}

function NotifRow({ show, icon: Icon, title, sub, onClick }: { show: boolean; icon: typeof Bell; title: string; sub: string; onClick: () => void }) {
  if (!show) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-muted"
    >
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{title}</div>
        <div className="truncate text-xs text-muted-foreground">{sub}</div>
      </div>
    </button>
  );
}

type SearchResult = {
  type: "booking" | "customer" | "provider" | "post" | "nav";
  id: string;
  title: string;
  subtitle?: string;
  to: string;
};

function GlobalSearchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const navResults = useMemo<SearchResult[]>(() => {
    const all = ADMIN_NAV.flatMap((g) => g.items).map((i) => ({
      type: "nav" as const, id: i.to, title: i.label, to: i.to, subtitle: "Jump to section",
    }));
    if (!q) return all;
    return all.filter((r) => r.title.toLowerCase().includes(q.toLowerCase()));
  }, [q]);

  // Cross-entity quick search is a placeholder; only the Navigate group
  // (static nav items) is wired up today.
  useEffect(() => {
    setResults([]);
    setSearching(false);
  }, [q]);

  function go(r: SearchResult) {
    onOpenChange(false);
    setQ("");
    navigate({ to: r.to });
    if (r.type !== "nav") toast.info(`Opened ${r.type}: ${r.title}`);
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search bookings, customers, providers, posts…" value={q} onValueChange={setQ} />
      <CommandList>
        <CommandEmpty>{searching ? "Searching…" : "No results."}</CommandEmpty>
        {results.length > 0 && (
          <>
            <CommandGroup heading="Results">
              {results.map((r) => (
                <CommandItem key={`${r.type}-${r.id}`} value={`${r.type}-${r.title}-${r.id}`} onSelect={() => go(r)}>
                  <span className="mr-2 inline-flex rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-primary">
                    {r.type}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm">{r.title}</div>
                    {r.subtitle && <div className="truncate text-xs text-muted-foreground">{r.subtitle}</div>}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}
        <CommandGroup heading="Navigate">
          {navResults.map((r) => (
            <CommandItem key={r.id} value={`nav-${r.title}`} onSelect={() => go(r)}>
              <Search className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              {r.title}
              <span className="ml-auto text-[10px] text-muted-foreground">{r.subtitle}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
