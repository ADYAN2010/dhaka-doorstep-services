/**
 * Shobsheba backend — Express + MySQL.
 * Start with:   npm --prefix backend run dev
 */
require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const apiRoutes = require("./routes");
const { notFound, errorHandler } = require("./middleware/error-handler");
const { closePool } = require("./config/db");

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 4000;

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

// ---- Core middleware ----
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// ---- Routes ----
app.get("/", (req, res) => {
  res.json({ name: "shobsheba-backend", status: "running", docs: "/api/health" });
});
app.use("/api", apiRoutes);

// ---- 404 + error handlers (must be last) ----
app.use(notFound);
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`✅ Backend listening on http://localhost:${PORT}`);
  console.log(`   Health:   GET  /api/health`);
  console.log(`   DB ping:  GET  /api/test-db`);
  console.log(`   Sample:   GET  /api/services`);
});

// ---- Graceful shutdown ----
async function shutdown(signal) {
  console.log(`\n${signal} received — closing server…`);
  server.close(async () => {
    await closePool().catch(() => {});
    process.exit(0);
  });
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
