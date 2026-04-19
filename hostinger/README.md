# Hostinger MySQL Bridge — Setup Guide

This folder contains everything needed to expose your Hostinger MySQL database
to the Lovable app (running on Cloudflare Workers) through a secure, signed
PHP endpoint.

```
Browser → TanStack server function (Workers, holds BRIDGE_SECRET)
        → HTTPS POST + HMAC-SHA256 → bridge.php on Hostinger
        → MySQL (your existing DB)
```

The frontend never sees DB credentials or raw SQL. Workers can't open MySQL
TCP directly, so PHP acts as the gateway.

---

## 1. Create the database

1. Log in to Hostinger → **hPanel** → **Databases → MySQL Databases**.
2. Create a new DB and a DB user. Note down:
   - DB name (e.g. `u123456789_shebabd`)
   - DB user (e.g. `u123456789_admin`)
   - DB password
3. Open **phpMyAdmin** for that database.
4. Go to the **SQL** tab and paste the entire contents of `schema.sql`. Click **Go**.
5. Verify tables appear in the left sidebar (`admin_users`, `bookings`, etc.).

### Set your admin password

The seed inserts an admin `admin@shebabd.local` with placeholder hash. Replace
it with your own:

```sql
UPDATE admin_users
SET password_hash = '<paste bcrypt hash here>'
WHERE email = 'admin@shebabd.local';
```

To generate a bcrypt hash, run this once on any PHP server (or
[bcrypt-generator.com](https://bcrypt-generator.com), cost 10):

```php
<?php echo password_hash('YourStrongPassword!', PASSWORD_BCRYPT);
```

---

## 2. Enable Remote MySQL (Cloud / Business plan)

1. hPanel → **Databases → Remote MySQL**.
2. Add `%` (any host) to the access list.
   - Workers' egress IPs are dynamic, so IP whitelisting is not viable.
   - Security comes from the HMAC signature on every bridge request +
     HTTPS + the strong DB password — not from IP filtering.
3. Save.

> If you only have shared hosting, Remote MySQL is firewalled — but you still
> don't need it: the PHP bridge connects to MySQL on `localhost`. Remote MySQL
> is only relevant if you want a different host to reach the DB directly.

---

## 3. Upload the bridge

1. hPanel → **File Manager** → open `public_html/`.
2. Create a folder, e.g. `api/`.
3. Upload these files into `public_html/api/`:
   - `bridge.php`
   - `.htaccess`
4. Copy `config.example.php` → `config.php` in the same folder, then edit it
   with your real DB creds and a long random `BRIDGE_SECRET`
   (generate with `openssl rand -hex 48`).
5. Verify `https://yourdomain.com/api/config.php` returns **403 Forbidden** —
   that confirms `.htaccess` is doing its job.
6. Verify `https://yourdomain.com/api/bridge.php` returns
   `{"error":{"code":"method_not_allowed","message":"POST only."}}` on a GET.

---

## 4. Tell Lovable about the bridge

In the Lovable app, three secrets need to be set (already requested in chat):

| Secret name              | Value                                                    |
|--------------------------|----------------------------------------------------------|
| `HOSTINGER_BRIDGE_URL`   | `https://yourdomain.com/api/bridge.php`                  |
| `HOSTINGER_BRIDGE_SECRET`| **Same** long random string you put in `config.php`      |
| `ADMIN_SESSION_SECRET`   | A different long random string (used to encrypt cookies) |

If `HOSTINGER_BRIDGE_SECRET` doesn't match `BRIDGE_SECRET` in `config.php`,
every request will return `bad_signature`.

---

## 5. Test end to end

From the admin console:
1. Go to `/login` and log in with the admin credentials you set in step 1.
2. The dashboard should load real counts from MySQL (zeros if DB is empty).
3. Lists (customers, providers, bookings, etc.) should load through
   the bridge with no console errors.

You can also test the bridge directly with curl — see `curl-test.md` for
signed-request examples.

---

## Security model — quick recap

- DB credentials live **only** in `config.php` on Hostinger (gitignored, blocked by `.htaccess`).
- Bridge accepts only **whitelisted action names** — no SQL ever comes from the client.
- Every request must be signed with HMAC-SHA256 of `<ts>.<nonce>.<body>` using
  the shared secret. Timestamp window is 5 minutes (replay protection).
- All DB access uses **PDO prepared statements** with bound parameters.
- Errors return generic `{ error: { code, message } }`. No stack traces leak.
- Admin passwords are stored as **bcrypt** (`password_hash` / `password_verify`).

---

## What's next (Phases 2 & 3)

- Phase 2 will add: reviews + tickets workflows, finance, CMS settings, advanced filters.
- Phase 3 will add: query optimization, RBAC matrix on bridge actions,
  audit log table, reporting endpoints, rate limiting on the PHP side.
