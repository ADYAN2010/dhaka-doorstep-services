# Shobsheba Backend

Standalone **Node.js + Express + MySQL** API. Lives in `backend/` and runs
independently of the React frontend.

```
backend/
├── server.js                 # Express app entry
├── config/db.js              # MySQL pool (mysql2/promise)
├── middleware/error-handler.js
├── controllers/              # Business logic
│   ├── health.controller.js
│   └── services.controller.js
├── routes/                   # HTTP routing only
│   ├── index.js
│   ├── health.routes.js
│   └── services.routes.js
├── .env.example              # Copy to .env and fill in
└── package.json
```

## 1. Install

```bash
cd backend
npm install
```

## 2. Add your database credentials

```bash
cp .env.example .env
```

Open `backend/.env` and replace the placeholders with your real Hostinger MySQL
credentials:

```
DB_HOST=srv547.hstgr.io
DB_PORT=3306
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password
```

> **Never commit `backend/.env`** — it's gitignored.
> The publishable example file (`.env.example`) is what others copy from.

For Hostinger shared MySQL you also need to enable **Remote MySQL** and
whitelist the IP of wherever this Node server runs (or use `%` for any host).

## 3. Run

```bash
npm run dev          # nodemon, restarts on file change
# or
npm start            # plain node
```

Server boots at `http://localhost:4000` (override with `PORT` in `.env`).

## 4. Verify

| Endpoint           | What it does                              |
| ------------------ | ----------------------------------------- |
| `GET /`            | Service banner                            |
| `GET /api/health`  | Process is alive                          |
| `GET /api/test-db` | Opens a real MySQL connection and pings   |
| `GET /api/services`| Sample CRUD: list                         |
| `POST /api/services` | Sample CRUD: create                     |
| `GET /api/services/:id` | Sample CRUD: read                    |
| `PATCH /api/services/:id` | Sample CRUD: update                |
| `DELETE /api/services/:id` | Sample CRUD: delete               |

```bash
curl http://localhost:4000/api/test-db
curl http://localhost:4000/api/services
curl -X POST http://localhost:4000/api/services \
  -H "Content-Type: application/json" \
  -d '{"name":"Deep cleaning","base_price":1500}'
```

The sample module expects this table:

```sql
CREATE TABLE services (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(150) NOT NULL,
  description  TEXT,
  base_price   DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_active    TINYINT(1) NOT NULL DEFAULT 1,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 5. Add a new module (pattern)

1. `controllers/<name>.controller.js` — business logic + validation
2. `routes/<name>.routes.js` — HTTP verbs → controller methods
3. Mount it in `routes/index.js`: `router.use("/<name>", require("./<name>.routes"));`

That's the whole convention — stays clean as the marketplace/admin grows.

## 6. Calling the API from the frontend

See `src/lib/api-client.ts` for a tiny typed fetch wrapper, and
`src/lib/api-examples.ts` for usage patterns (list, create, update, delete).
The frontend talks **only** to `/api/...` over HTTPS — it never touches MySQL
directly and never sees DB credentials.

In your frontend `.env`:

```
VITE_API_BASE_URL=http://localhost:4000
```

## Security notes

- All queries use **parameterised** `?` placeholders → no SQL injection.
- DB credentials live **only** in `backend/.env`, never in the frontend bundle.
- `error-handler.js` strips internal errors in production responses.
- CORS is locked to the origins listed in `CORS_ORIGIN`.
- Add auth middleware (JWT/session) before exposing write endpoints publicly.
