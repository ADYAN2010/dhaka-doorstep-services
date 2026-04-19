/**
 * Shobsheba backend — Express + MySQL — production-hardened.
 *
 * Boots cleanly even if DB env vars are missing so you can deploy first
 * and configure credentials after. /api/admin/system-status will report
 * the DB as not-configured until you set DB_* vars.
 */
require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const pinoHttp = require("pino-http");

const apiRoutes = require("./routes");
const { notFound, errorHandler } = require("./middleware/error-handler");
const { closePool, isConfigured } = require("./config/db");
const logger = require("./lib/logger");

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 4000;
const isProd = process.env.NODE_ENV === "production";

// Trust the first proxy (Hostinger / Nginx in front of Node)
app.set("trust proxy", 1);

// ---- Security headers ----
app.use(
  helmet({
    contentSecurityPolicy: false, // API only — let frontend set its own CSP
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

// ---- CORS ----
const origins = (process.env.CORS_ORIGIN || "*")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: origins.includes("*") ? true : origins,
    credentials: true,
  }),
);

// ---- Body + logging + compression ----
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(compression());
app.use(
  pinoHttp({
    logger,
    customLogLevel: (_req, res, err) => {
      if (err || res.statusCode >= 500) return "error";
      if (res.statusCode >= 400) return "warn";
      return "info";
    },
    serializers: {
      req: (req) => ({ id: req.id, method: req.method, url: req.url, ip: req.ip || req.remoteAddress }),
      res: (res) => ({ statusCode: res.statusCode }),
    },
  }),
);

// ---- Rate limits ----
// Global gentle limit
app.use(
  "/api",
  rateLimit({
    windowMs: 60_000,
    max: 240, // 4 req/sec sustained per IP
    standardHeaders: true,
    legacyHeaders: false,
  }),
);
// Stricter limit on auth — block credential-stuffing
app.use(
  "/api/auth/login",
  rateLimit({
    windowMs: 15 * 60_000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { code: "rate_limited", message: "Too many login attempts. Try again later." } },
  }),
);
app.use(
  "/api/auth/bootstrap",
  rateLimit({ windowMs: 60 * 60_000, max: 5, standardHeaders: true, legacyHeaders: false }),
);

// ---- Routes ----
app.get("/", (req, res) => {
  res.json({
    name: "shobsheba-backend",
    status: "running",
    db_configured: isConfigured(),
    docs: "/api/health",
  });
});
app.use("/api", apiRoutes);

// ---- 404 + error handlers (must be last) ----
app.use(notFound);
app.use(errorHandler);

const server = app.listen(PORT, () => {
  logger.info(
    { port: PORT, env: isProd ? "production" : "development", db_configured: isConfigured() },
    `Backend listening on http://localhost:${PORT}`,
  );
});

// ---- Graceful shutdown ----
async function shutdown(signal) {
  logger.info({ signal }, "shutdown signal received — closing server");
  server.close(async () => {
    await closePool().catch(() => {});
    process.exit(0);
  });
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("unhandledRejection", (err) => logger.error({ err }, "unhandledRejection"));
process.on("uncaughtException", (err) => logger.error({ err }, "uncaughtException"));
