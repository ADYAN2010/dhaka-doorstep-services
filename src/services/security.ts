/**
 * Mock security service powering the admin security & permissions module.
 * Everything here lives in memory so the UI feels real without yet wiring
 * a backend. State is shared via a tiny pub/sub so multiple components can
 * stay in sync.
 */

export type PermissionKey =
  | "bookings.view"
  | "bookings.assign"
  | "bookings.cancel"
  | "bookings.refund"
  | "providers.view"
  | "providers.approve"
  | "providers.suspend"
  | "finance.view"
  | "finance.payout"
  | "finance.refund"
  | "marketing.view"
  | "marketing.publish"
  | "marketing.coupon"
  | "support.view"
  | "support.reply"
  | "support.escalate"
  | "settings.view"
  | "settings.edit"
  | "security.view"
  | "security.manage_admins"
  | "security.audit"
  | "security.restrict";

export type PermissionGroup = {
  id: string;
  name: string;
  description: string;
  permissions: { key: PermissionKey; label: string; description: string; sensitive?: boolean }[];
};

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: "bookings",
    name: "Bookings & operations",
    description: "Booking lifecycle, assignment, cancellations and refunds",
    permissions: [
      { key: "bookings.view", label: "View bookings", description: "Read access to all bookings" },
      { key: "bookings.assign", label: "Assign provider", description: "Manually assign a provider to a booking" },
      { key: "bookings.cancel", label: "Cancel booking", description: "Cancel a confirmed booking" },
      { key: "bookings.refund", label: "Approve refund", description: "Approve a customer refund", sensitive: true },
    ],
  },
  {
    id: "providers",
    name: "Provider management",
    description: "Approve, suspend and manage provider accounts",
    permissions: [
      { key: "providers.view", label: "View providers", description: "Read access to provider profiles" },
      { key: "providers.approve", label: "Approve applications", description: "Approve new provider applications" },
      { key: "providers.suspend", label: "Suspend providers", description: "Disable a provider account", sensitive: true },
    ],
  },
  {
    id: "finance",
    name: "Finance",
    description: "Payouts, ledger and refunds",
    permissions: [
      { key: "finance.view", label: "View finance", description: "Read commission ledger and payout queue" },
      { key: "finance.payout", label: "Issue payouts", description: "Create and approve provider payouts", sensitive: true },
      { key: "finance.refund", label: "Issue refunds", description: "Issue refunds against payments", sensitive: true },
    ],
  },
  {
    id: "marketing",
    name: "Marketing & CMS",
    description: "Content, campaigns and growth tools",
    permissions: [
      { key: "marketing.view", label: "View CMS", description: "Read campaigns, banners and content" },
      { key: "marketing.publish", label: "Publish content", description: "Publish blog, banners and homepage changes" },
      { key: "marketing.coupon", label: "Manage coupons", description: "Create discount codes and referral rules" },
    ],
  },
  {
    id: "support",
    name: "Support & disputes",
    description: "Ticket triage, replies and escalations",
    permissions: [
      { key: "support.view", label: "View tickets", description: "Read tickets and customer messages" },
      { key: "support.reply", label: "Reply to tickets", description: "Send replies and internal notes" },
      { key: "support.escalate", label: "Escalate disputes", description: "Mark disputes as urgent / hand off" },
    ],
  },
  {
    id: "settings",
    name: "Platform settings",
    description: "Branding, identity and operational settings",
    permissions: [
      { key: "settings.view", label: "View settings", description: "Read general platform settings" },
      { key: "settings.edit", label: "Edit settings", description: "Modify branding, identity and config", sensitive: true },
    ],
  },
  {
    id: "security",
    name: "Security & access",
    description: "Admin access, audit logs and account restrictions",
    permissions: [
      { key: "security.view", label: "View security center", description: "Read access to the security console" },
      { key: "security.manage_admins", label: "Manage admins", description: "Add, remove or modify admin roles", sensitive: true },
      { key: "security.audit", label: "View audit log", description: "Read full audit log and activity history" },
      { key: "security.restrict", label: "Restrict accounts", description: "Suspend, lock or restrict any account", sensitive: true },
    ],
  },
];

export const ALL_PERMISSIONS: PermissionKey[] = PERMISSION_GROUPS.flatMap((g) =>
  g.permissions.map((p) => p.key),
);

export type RoleId = "super_admin" | "ops_admin" | "finance_admin" | "support_lead" | "content_editor" | "read_only";

export type Role = {
  id: RoleId;
  name: string;
  description: string;
  protected?: boolean; // can't remove permissions or delete
  color: string; // hex/oklch fragment for badges
  permissions: PermissionKey[];
};

const DEFAULT_ROLES: Role[] = [
  {
    id: "super_admin",
    name: "Super admin",
    description: "Full access to every surface. Cannot be modified.",
    protected: true,
    color: "rose",
    permissions: [...ALL_PERMISSIONS],
  },
  {
    id: "ops_admin",
    name: "Operations admin",
    description: "Day-to-day bookings, providers and support",
    color: "indigo",
    permissions: [
      "bookings.view", "bookings.assign", "bookings.cancel",
      "providers.view", "providers.approve", "providers.suspend",
      "support.view", "support.reply", "support.escalate",
      "settings.view", "security.view",
    ],
  },
  {
    id: "finance_admin",
    name: "Finance admin",
    description: "Payouts, refunds and commission ledger",
    color: "emerald",
    permissions: [
      "bookings.view", "bookings.refund",
      "finance.view", "finance.payout", "finance.refund",
      "providers.view", "settings.view",
    ],
  },
  {
    id: "support_lead",
    name: "Support lead",
    description: "Manages all tickets and customer disputes",
    color: "sky",
    permissions: [
      "bookings.view",
      "support.view", "support.reply", "support.escalate",
      "providers.view",
    ],
  },
  {
    id: "content_editor",
    name: "Content editor",
    description: "Marketing, CMS and growth campaigns",
    color: "violet",
    permissions: [
      "marketing.view", "marketing.publish", "marketing.coupon",
      "settings.view",
    ],
  },
  {
    id: "read_only",
    name: "Read-only auditor",
    description: "Read access for reporting and audits",
    color: "slate",
    permissions: [
      "bookings.view", "providers.view", "finance.view",
      "marketing.view", "support.view", "settings.view",
      "security.view", "security.audit",
    ],
  },
];

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  roleId: RoleId;
  status: "active" | "invited" | "suspended" | "locked";
  twoFactor: boolean;
  lastActive: string; // ISO
  createdAt: string;
  ip?: string;
  location?: string;
  restrictionReason?: string;
};

export type AuditEvent = {
  id: string;
  at: string; // ISO
  actorId: string;
  actorName: string;
  action: string;
  category: "auth" | "permission" | "booking" | "finance" | "provider" | "settings" | "security" | "support";
  target?: string;
  targetType?: string;
  ip?: string;
  location?: string;
  severity: "info" | "warning" | "critical";
  suspicious?: boolean;
  details?: string;
};

export type SessionInfo = {
  id: string;
  adminId: string;
  device: string;
  browser: string;
  os: string;
  ip: string;
  location: string;
  startedAt: string;
  lastActiveAt: string;
  current?: boolean;
  suspicious?: boolean;
};

export type Restriction = {
  id: string;
  targetType: "admin" | "customer" | "provider";
  targetName: string;
  targetId: string;
  type: "suspend" | "lock" | "ip_ban" | "rate_limit";
  reason: string;
  createdBy: string;
  createdAt: string;
  expiresAt?: string;
  active: boolean;
};

// ---- mutable in-memory state ----------------------------------------------
let roles: Role[] = JSON.parse(JSON.stringify(DEFAULT_ROLES));

let admins: AdminUser[] = [
  {
    id: "u_1",
    name: "Tasnia Rahman",
    email: "tasnia@servicehub.bd",
    roleId: "super_admin",
    status: "active",
    twoFactor: true,
    lastActive: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 320).toISOString(),
    ip: "103.115.27.4", location: "Dhaka, BD",
  },
  {
    id: "u_2",
    name: "Imran Hossain",
    email: "imran@servicehub.bd",
    roleId: "ops_admin",
    status: "active",
    twoFactor: true,
    lastActive: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 180).toISOString(),
    ip: "103.115.27.18", location: "Dhaka, BD",
  },
  {
    id: "u_3",
    name: "Nadia Karim",
    email: "nadia@servicehub.bd",
    roleId: "finance_admin",
    status: "active",
    twoFactor: true,
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 95).toISOString(),
    ip: "103.115.30.62", location: "Dhaka, BD",
  },
  {
    id: "u_4",
    name: "Rafi Ahmed",
    email: "rafi@servicehub.bd",
    roleId: "support_lead",
    status: "active",
    twoFactor: false,
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
    ip: "103.115.30.71", location: "Dhaka, BD",
  },
  {
    id: "u_5",
    name: "Mehedi Khan",
    email: "mehedi@servicehub.bd",
    roleId: "content_editor",
    status: "invited",
    twoFactor: false,
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
  },
  {
    id: "u_6",
    name: "Shamima Akter",
    email: "shamima@servicehub.bd",
    roleId: "read_only",
    status: "suspended",
    twoFactor: false,
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 220).toISOString(),
    ip: "103.115.45.9", location: "Chittagong, BD",
    restrictionReason: "Failed 2FA enrollment after 30-day grace period",
  },
];

const now = Date.now();
const min = (n: number) => new Date(now - n * 60 * 1000).toISOString();
const hr = (n: number) => new Date(now - n * 60 * 60 * 1000).toISOString();
const day = (n: number) => new Date(now - n * 24 * 60 * 60 * 1000).toISOString();

let auditLog: AuditEvent[] = [
  { id: "a_1", at: min(2), actorId: "u_2", actorName: "Imran Hossain", action: "Approved provider application",
    category: "provider", target: "Rahim's Cleaning Co.", targetType: "provider", ip: "103.115.27.18",
    location: "Dhaka, BD", severity: "info" },
  { id: "a_2", at: min(7), actorId: "u_3", actorName: "Nadia Karim", action: "Issued payout",
    category: "finance", target: "৳ 24,500 → Rahim's Cleaning Co.", targetType: "payout",
    ip: "103.115.30.62", location: "Dhaka, BD", severity: "info",
    details: "Payout PO-00231 covering 8 commission entries from Mar 1–15." },
  { id: "a_3", at: min(14), actorId: "u_1", actorName: "Tasnia Rahman", action: "Modified role permissions",
    category: "permission", target: "Operations admin", targetType: "role",
    ip: "103.115.27.4", location: "Dhaka, BD", severity: "warning",
    details: "Granted bookings.refund to Operations admin." },
  { id: "a_4", at: min(38), actorId: "u_4", actorName: "Rafi Ahmed", action: "Failed login attempt",
    category: "auth", ip: "182.16.84.221", location: "Sylhet, BD", severity: "warning", suspicious: true,
    details: "3 failed attempts within 4 minutes from a new IP." },
  { id: "a_5", at: hr(2), actorId: "u_3", actorName: "Nadia Karim", action: "Approved refund",
    category: "finance", target: "Booking BK-2412 · ৳ 1,800", targetType: "refund",
    ip: "103.115.30.62", location: "Dhaka, BD", severity: "warning" },
  { id: "a_6", at: hr(3), actorId: "u_2", actorName: "Imran Hossain", action: "Cancelled booking",
    category: "booking", target: "BK-2410", ip: "103.115.27.18",
    location: "Dhaka, BD", severity: "info", details: "Customer no-show; cancelled with provider notification." },
  { id: "a_7", at: hr(5), actorId: "u_1", actorName: "Tasnia Rahman", action: "Suspended admin",
    category: "security", target: "Shamima Akter", targetType: "admin",
    ip: "103.115.27.4", location: "Dhaka, BD", severity: "critical",
    details: "Suspended for failed 2FA enrollment after grace period." },
  { id: "a_8", at: hr(6), actorId: "u_2", actorName: "Imran Hossain", action: "Logged in",
    category: "auth", ip: "103.115.27.18", location: "Dhaka, BD", severity: "info" },
  { id: "a_9", at: hr(9), actorId: "u_5", actorName: "Mehedi Khan", action: "Login from new device",
    category: "auth", ip: "45.67.12.88", location: "Singapore, SG", severity: "warning", suspicious: true,
    details: "First time login from Singapore; outside usual region." },
  { id: "a_10", at: hr(12), actorId: "u_3", actorName: "Nadia Karim", action: "Updated payout settings",
    category: "settings", target: "Auto-payout threshold", ip: "103.115.30.62",
    location: "Dhaka, BD", severity: "info", details: "Threshold raised from ৳ 5,000 to ৳ 10,000." },
  { id: "a_11", at: day(1), actorId: "u_1", actorName: "Tasnia Rahman", action: "Created admin",
    category: "security", target: "Mehedi Khan (content_editor)", targetType: "admin",
    ip: "103.115.27.4", location: "Dhaka, BD", severity: "info" },
  { id: "a_12", at: day(2), actorId: "u_4", actorName: "Rafi Ahmed", action: "Escalated dispute",
    category: "support", target: "Ticket TK-1042", ip: "103.115.30.71",
    location: "Dhaka, BD", severity: "warning" },
  { id: "a_13", at: day(3), actorId: "u_1", actorName: "Tasnia Rahman", action: "Rotated API key",
    category: "security", target: "Public storefront key", ip: "103.115.27.4",
    location: "Dhaka, BD", severity: "critical", details: "Old key revoked. New key distributed to deploys." },
  { id: "a_14", at: day(4), actorId: "u_2", actorName: "Imran Hossain", action: "Bulk approved 12 providers",
    category: "provider", ip: "103.115.27.18", location: "Dhaka, BD", severity: "info" },
  { id: "a_15", at: day(5), actorId: "u_3", actorName: "Nadia Karim", action: "Exported finance report",
    category: "finance", target: "March payouts CSV", ip: "103.115.30.62",
    location: "Dhaka, BD", severity: "info" },
];

let sessions: SessionInfo[] = [
  { id: "s_1", adminId: "u_1", device: "MacBook Pro 16\"", browser: "Chrome 124", os: "macOS 14.4",
    ip: "103.115.27.4", location: "Dhaka, BD", startedAt: hr(3), lastActiveAt: min(2), current: true },
  { id: "s_2", adminId: "u_1", device: "iPhone 15 Pro", browser: "Safari 17", os: "iOS 17.4",
    ip: "103.115.27.4", location: "Dhaka, BD", startedAt: hr(8), lastActiveAt: min(35) },
  { id: "s_3", adminId: "u_2", device: "Dell XPS", browser: "Edge 124", os: "Windows 11",
    ip: "103.115.27.18", location: "Dhaka, BD", startedAt: hr(2), lastActiveAt: min(22) },
  { id: "s_4", adminId: "u_3", device: "MacBook Air", browser: "Firefox 125", os: "macOS 14.3",
    ip: "103.115.30.62", location: "Dhaka, BD", startedAt: hr(6), lastActiveAt: hr(2) },
  { id: "s_5", adminId: "u_4", device: "Pixel 8", browser: "Chrome 124", os: "Android 14",
    ip: "182.16.84.221", location: "Sylhet, BD", startedAt: hr(1), lastActiveAt: min(38), suspicious: true },
  { id: "s_6", adminId: "u_5", device: "Unknown laptop", browser: "Chrome 122", os: "Windows 10",
    ip: "45.67.12.88", location: "Singapore, SG", startedAt: hr(9), lastActiveAt: hr(8), suspicious: true },
];

let restrictions: Restriction[] = [
  { id: "r_1", targetType: "admin", targetName: "Shamima Akter", targetId: "u_6", type: "suspend",
    reason: "Failed 2FA enrollment after grace period", createdBy: "Tasnia Rahman",
    createdAt: hr(5), active: true },
  { id: "r_2", targetType: "customer", targetName: "Hasan M. (cust_3192)", targetId: "cust_3192",
    type: "rate_limit", reason: "Booking spam — 14 cancellations in 24h", createdBy: "Imran Hossain",
    createdAt: hr(20), expiresAt: day(-2), active: true },
  { id: "r_3", targetType: "provider", targetName: "Quick Fix Ltd.", targetId: "prov_88", type: "lock",
    reason: "Pending KYC verification", createdBy: "Nadia Karim", createdAt: day(2), active: true },
  { id: "r_4", targetType: "customer", targetName: "Anonymous IP", targetId: "ip_45.67.12.88", type: "ip_ban",
    reason: "Brute-force login attempts on staff portal", createdBy: "System", createdAt: day(1), active: true },
];

// ---- pub/sub ---------------------------------------------------------------
type Listener = () => void;
const listeners = new Set<Listener>();
function notify() { listeners.forEach((l) => l()); }
export function subscribeSecurity(l: Listener) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

// ---- API -------------------------------------------------------------------
export const securityService = {
  // roles
  listRoles(): Role[] { return roles; },
  togglePermission(roleId: RoleId, perm: PermissionKey, granted: boolean) {
    roles = roles.map((r) => {
      if (r.id !== roleId) return r;
      if (r.protected) return r;
      const set = new Set(r.permissions);
      if (granted) set.add(perm); else set.delete(perm);
      return { ...r, permissions: Array.from(set) };
    });
    notify();
  },
  resetRoles() {
    roles = JSON.parse(JSON.stringify(DEFAULT_ROLES));
    notify();
  },

  // admins
  listAdmins(): AdminUser[] { return admins; },
  setAdminRole(id: string, roleId: RoleId) {
    admins = admins.map((a) => (a.id === id ? { ...a, roleId } : a));
    notify();
  },
  setAdminStatus(id: string, status: AdminUser["status"], reason?: string) {
    admins = admins.map((a) =>
      a.id === id ? { ...a, status, restrictionReason: reason ?? a.restrictionReason } : a,
    );
    notify();
  },
  toggle2FA(id: string) {
    admins = admins.map((a) => (a.id === id ? { ...a, twoFactor: !a.twoFactor } : a));
    notify();
  },

  // audit
  listAudit(): AuditEvent[] { return auditLog; },
  flaggedEvents(): AuditEvent[] {
    return auditLog.filter((e) => e.suspicious || e.severity === "critical");
  },
  recordEvent(e: Omit<AuditEvent, "id" | "at">) {
    auditLog = [{ ...e, id: `a_${Date.now()}`, at: new Date().toISOString() }, ...auditLog];
    notify();
  },

  // sessions
  listSessions(): SessionInfo[] { return sessions; },
  revokeSession(id: string) {
    sessions = sessions.filter((s) => s.id !== id);
    notify();
  },
  revokeAllSessionsFor(adminId: string, exceptCurrent = true) {
    sessions = sessions.filter((s) => s.adminId !== adminId || (exceptCurrent && s.current));
    notify();
  },

  // restrictions
  listRestrictions(): Restriction[] { return restrictions; },
  addRestriction(r: Omit<Restriction, "id" | "createdAt" | "active">) {
    restrictions = [
      { ...r, id: `r_${Date.now()}`, createdAt: new Date().toISOString(), active: true },
      ...restrictions,
    ];
    notify();
  },
  liftRestriction(id: string) {
    restrictions = restrictions.map((r) => (r.id === id ? { ...r, active: false } : r));
    notify();
  },

  // helpers
  countPermissionsByGroup(roleId: RoleId): Record<string, { granted: number; total: number }> {
    const role = roles.find((r) => r.id === roleId);
    const out: Record<string, { granted: number; total: number }> = {};
    PERMISSION_GROUPS.forEach((g) => {
      out[g.id] = {
        total: g.permissions.length,
        granted: role ? g.permissions.filter((p) => role.permissions.includes(p.key)).length : 0,
      };
    });
    return out;
  },
};

// React hook helper
import { useEffect, useState } from "react";
export function useSecuritySnapshot() {
  const [snap, setSnap] = useState({
    roles: securityService.listRoles(),
    admins: securityService.listAdmins(),
    audit: securityService.listAudit(),
    sessions: securityService.listSessions(),
    restrictions: securityService.listRestrictions(),
  });
  useEffect(() => {
    return subscribeSecurity(() =>
      setSnap({
        roles: securityService.listRoles(),
        admins: securityService.listAdmins(),
        audit: securityService.listAudit(),
        sessions: securityService.listSessions(),
        restrictions: securityService.listRestrictions(),
      }),
    );
  }, []);
  return snap;
}

// Pretty time
export function timeAgo(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}
