
## Architecture: PHP Bridge on Hostinger ↔ TanStack Start (Workers)

```
Browser → TanStack Server Functions (Workers, holds BRIDGE_SECRET)
        → HTTPS POST → bridge.php on Hostinger (holds DB creds)
        → MySQL (Cloud/Business plan, remote access on)
```

**Why:** Workers can't open raw MySQL TCP. PHP bridge keeps DB creds on Hostinger, exposes a single signed JSON-RPC endpoint. Frontend never sees creds or SQL.

---

### Phase 1 — Deliverables this round

**1. SQL schema file** (`hostinger/schema.sql`) — ready to import in phpMyAdmin:
- `admin_users` (bcrypt password_hash, role, last_login)
- `customers`, `providers`, `categories`, `services`
- `bookings`, `cities`, `areas`, `zones`
- `reviews`, `support_tickets`
- Indexes, FKs, `created_at`/`updated_at` triggers
- Seed: 1 admin (you'll set password), sample categories + cities

**2. PHP bridge** (`hostinger/bridge.php` + `hostinger/.htaccess` + `hostinger/README.md`):
- Single endpoint, accepts `{action, params}` JSON
- HMAC-SHA256 signature check using `BRIDGE_SECRET` (rejects unsigned/replayed requests, 5-min timestamp window)
- Whitelisted action map → parameterized PDO queries (no dynamic SQL from client)
- Bcrypt password verify for `admin.login`, returns signed session token
- Structured JSON errors, no stack traces leaked
- Reads DB creds from `hostinger/config.php` (gitignored template provided)

**3. Server-side data layer in TanStack Start:**
- `src/server/bridge.ts` — signed fetch client, retries, timeout, typed responses (server-only, uses `process.env`)
- `src/server/repositories/` — one file per entity (`admins.ts`, `customers.ts`, `providers.ts`, `bookings.ts`, `categories.ts`, `services.ts`, `locations.ts`, `reviews.ts`, `tickets.ts`) — each exports typed query functions
- `src/server/validation.ts` — Zod schemas per action
- `src/utils/admin.functions.ts` — `createServerFn` wrappers (admin.login, dashboard.stats, list endpoints, basic CRUD) with `inputValidator(zod)` + structured errors

**4. Admin auth flow:**
- `adminLogin` server fn → bridge → bcrypt verify → returns session token
- Token stored in encrypted httpOnly cookie via `useSession` from `@tanstack/react-start/server`
- `requireAdmin` middleware for every admin server fn
- Refactor `src/routes/login.tsx` admin path + protect `_authenticated` admin routes through the new session

**5. Frontend wiring (Phase 1 scope):**
- Admin overview, customers list, providers list, bookings list, services/categories list, locations list — swap mock data for `useSuspenseQuery` against the new server fns
- UI/design untouched

**6. Secrets (I'll request via secure form):**
- `HOSTINGER_BRIDGE_URL` — full https URL to bridge.php
- `HOSTINGER_BRIDGE_SECRET` — long random string, also pasted into config.php
- `ADMIN_SESSION_SECRET` — for cookie encryption

**7. Setup README** (`hostinger/README.md`):
- Step-by-step: enable Remote MySQL → whitelist IPs (note: Workers IPs are dynamic, recommend `%` + rely on bridge secret, or use Hostinger's "All" + strong secret) → import schema.sql → upload bridge.php → set config.php → set the 3 secrets in Lovable → done.

---

### Phases 2 & 3 (later messages)
- **P2:** reviews, tickets, finance, CMS settings, advanced filters
- **P3:** query optimization, RBAC matrix on bridge actions, audit log table, reporting endpoints, rate limiting on PHP side

---

### Honest caveats
- **Workers egress IPs are dynamic** — don't whitelist by IP; rely on the HMAC secret + HTTPS. I'll document this clearly.
- **Lovable Cloud (Postgres) stays installed** but the new admin flow will read/write MySQL via the bridge. You can disable Cloud later or keep both running side by side.
- **You must run two manual steps** I cannot do for you: (a) import `schema.sql` in phpMyAdmin, (b) upload `bridge.php` + `config.php` to Hostinger. README walks through both.
