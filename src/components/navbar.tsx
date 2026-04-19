import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, Menu, X, ChevronDown, LogOut, LayoutDashboard, User as UserIcon, Shield, MessageCircle } from "lucide-react";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "./auth-provider";

const NAV = [
  { to: "/services", label: "Services" },
  { to: "/providers", label: "Providers" },
  { to: "/areas", label: "Areas" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/about", label: "About" },
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, roles, signOut, loading } = useAuth();
  const isAdmin = roles.includes("admin");
  const isProvider = roles.includes("provider");
  const dashboardTo = isProvider ? "/provider-dashboard" : "/dashboard";
  const navigate = useNavigate();
  const unread = 0;

  async function handleSignOut() {
    await signOut();
    setMenuOpen(false);
    navigate({ to: "/" });
  }

  const displayName = user?.full_name?.trim() || user?.email || "Account";
  const firstName = displayName.split(" ")[0];
  const initials =
    displayName
      .split(" ")
      .map((s) => s[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    "U";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container-page flex h-16 items-center gap-4">
        <Link to="/" className="shrink-0">
          <Logo />
        </Link>

        <nav className="ml-6 hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{ className: "rounded-full px-3 py-2 text-sm font-medium bg-muted text-foreground" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            className="hidden items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted lg:inline-flex"
          >
            <MapPin className="h-3.5 w-3.5 text-primary" />
            Dhaka
            <ChevronDown className="h-3.5 w-3.5 opacity-60" />
          </button>

          <ThemeToggle />

          {!loading && user ? (
            <div className="relative hidden md:block">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="relative flex items-center gap-2 rounded-full border border-border bg-background py-1 pl-1 pr-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                aria-label={`Account menu for ${displayName}`}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-primary text-xs font-bold text-primary-foreground">
                  {initials}
                </span>
                <span className="hidden max-w-[120px] truncate lg:inline">{firstName}</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                {unread > 0 && (
                  <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground ring-2 ring-background">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </button>
              {menuOpen && (
                <>
                  <button
                    type="button"
                    aria-hidden
                    className="fixed inset-0 z-40 cursor-default"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-border bg-popover p-1 shadow-elevated">
                    <div className="flex items-center gap-3 px-3 py-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-primary text-sm font-bold text-primary-foreground">
                        {initials}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-foreground">
                          {displayName}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {user.email}
                        </div>
                      </div>
                    </div>
                    <div className="my-1 h-px bg-border" />
                    <Link
                      to={dashboardTo}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted"
                    >
                      <LayoutDashboard className="h-4 w-4" /> Dashboard
                    </Link>
                    <Link
                      to="/messages"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted"
                    >
                      <span className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4" /> Messages
                      </span>
                      {unread > 0 && (
                        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                          {unread}
                        </span>
                      )}
                    </Link>
                    {isProvider && (
                      <Link
                        to="/dashboard"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted"
                      >
                        <UserIcon className="h-4 w-4" /> My bookings
                      </Link>
                    )}
                    <Link
                      to="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted"
                    >
                      <UserIcon className="h-4 w-4" /> Profile
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted"
                      >
                        <Shield className="h-4 w-4" /> Admin
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
                    >
                      <LogOut className="h-4 w-4" /> Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : !loading ? (
            <>
              <Link
                to="/login"
                className="hidden rounded-full px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted md:inline-flex"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="hidden rounded-full bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.02] md:inline-flex"
              >
                Sign up
              </Link>
            </>
          ) : null}

          <button
            type="button"
            aria-label="Open menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border md:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="container-page flex flex-col gap-1 py-4">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-base font-medium text-foreground hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              {user ? (
                <>
                  <div className="flex items-center gap-3 rounded-lg bg-muted px-3 py-2 text-sm">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-primary text-xs font-bold text-primary-foreground">
                      {initials}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate font-medium text-foreground">{displayName}</div>
                      <div className="truncate text-xs text-muted-foreground">{user.email}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setOpen(false); handleSignOut(); }}
                    className="rounded-full border border-border px-4 py-2 text-center text-sm font-medium"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="rounded-full border border-border px-4 py-2 text-center text-sm font-medium"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setOpen(false)}
                    className="rounded-full bg-gradient-primary px-4 py-2 text-center text-sm font-semibold text-primary-foreground"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
