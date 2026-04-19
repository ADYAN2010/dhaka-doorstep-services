# Deploying to Hostinger (Node.js Cloud / Business)

This backend is **production-ready** and boots even when the database is not
yet configured. That means you can deploy first, then paste your MySQL
credentials into Hostinger's environment-variable panel and restart.

---

## 0. What you'll have after deploying

```
https://api.your-domain.com   →  this Node app
                              →  /api/health         (public)
                              →  /api/auth/login     (public, rate-limited)
                              →  /api/admin/...      (JWT-protected)
                              →  /api/services, /api/customers, ...
```

The frontend (built with Vite) talks **only** to this URL via `VITE_API_BASE_URL`.
It never sees DB credentials.

---

## 1. Create the MySQL database in Hostinger

1. **hPanel → Databases → MySQL Databases**
2. Create a database, user, and password. Note them down.
3. **Remote MySQL** → either whitelist your Node host's IP, or set `%` for
   any host (less secure, fine to start). On Hostinger Node.js Apps, MySQL
   is on the same machine — no remote access needed.

## 2. Upload this `backend/` folder

Use **hPanel → File Manager** or SFTP. Upload everything in `backend/`
**except** `node_modules/` and `.env` (Hostinger will install deps and
inject env vars itself).

## 3. Create the Node.js app

1. **hPanel → Advanced → Node.js** (or "Node.js Apps")
2. **Create application**:
   - Node version: **18 or 20**
   - Application root: the path where you uploaded `backend/`
   - Application URL: e.g. `api.your-domain.com`
   - Application startup file: `server.js`
3. Click **Create**, then **NPM install**.

## 4. Set environment variables (the only place credentials live)

In the same Node.js panel, **Environment variables** section, add:

| Name                    | Value                                              |
| ----------------------- | -------------------------------------------------- |
| `NODE_ENV`              | `production`                                       |
| `PORT`                  | (Hostinger sets this — leave blank or use `4000`)  |
| `CORS_ORIGIN`           | `https://your-frontend-domain.com`                 |
| `DB_HOST`               | `localhost` (or remote host)                       |
| `DB_PORT`               | `3306`                                             |
| `DB_NAME`               | your database name                                 |
| `DB_USER`               | your database user                                 |
| `DB_PASSWORD`           | your database password                             |
| `DB_SSL`                | `false` (most Hostinger hosts)                     |
| `JWT_SECRET`            | a 48-char random string (see below)                |
| `JWT_EXPIRES_IN`        | `12h`                                              |

Generate `JWT_SECRET` locally:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

## 5. Run the schema migration

In hPanel's Node.js panel click **Run NPM script** → choose `migrate`,
or open the panel terminal and run:

```bash
npm run migrate
```

This creates `services`, `customers`, `providers`, `categories`, `cities`,
`areas`, `bookings`, `admin_users`, and a `_migrations` tracking table.

## 6. Bootstrap the first admin (one time)

```bash
curl -X POST https://api.your-domain.com/api/auth/bootstrap \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"a-strong-password","full_name":"Owner"}'
```

After this returns 201, the endpoint refuses further calls (returns 409).

## 7. Verify

```bash
# Public
curl https://api.your-domain.com/api/health
curl https://api.your-domain.com/api/test-db          # → { ok: true, ... }

# Authenticated
TOKEN=$(curl -s -X POST https://api.your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"a-strong-password"}' | jq -r .token)

curl https://api.your-domain.com/api/admin/system-status \
  -H "Authorization: Bearer $TOKEN"
```

`system-status` returns a **masked** view of DB host/user, ping result, and
JWT status — safe to expose to logged-in admins, never to the public.

---

## 8. Deploy the frontend (separate)

In the **frontend's** environment, set:
```
VITE_API_BASE_URL=https://api.your-domain.com
```
Then build and upload `dist/` to your static hosting (or to a separate
Hostinger site / subdomain).

---

## What's already hardened

- **Helmet** security headers, **gzip** compression
- **Rate limits**: 240 req/min global, 20 logins / 15 min, 5 bootstraps / hour
- **CORS** locked to `CORS_ORIGIN`
- **bcrypt** password hashing (cost 12)
- **JWT** in `Authorization: Bearer` header
- **Parameterised SQL** everywhere — no string concatenation
- **Stack traces hidden** in production responses
- **Graceful DB failure**: app boots and serves `/api/health` even if DB env
  is missing; protected routes return `503 DB_NOT_CONFIGURED` until you set vars

## What's NOT done (and intentionally so)

- No public page exposes any DB info — `system-status` requires admin auth.
- No write endpoint is open without a JWT.
- No DB credentials live in code or in `backend/.env.example`.

---

## Local-only quick start (no Hostinger yet)

```bash
cd backend
cp .env.example .env        # then edit with your local DB creds
npm install
npm run migrate
npm run dev
```
