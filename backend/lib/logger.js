/**
 * Centralized pino logger.
 *
 * Production: JSON lines (machine-parseable, Hostinger / log aggregators).
 * Development: pretty-printed if `pino-pretty` is installed locally, else JSON.
 *
 * Redacts auth headers and password fields so secrets never reach logs.
 */
const pino = require("pino");

const isProd = process.env.NODE_ENV === "production";
const level = process.env.LOG_LEVEL || (isProd ? "info" : "debug");

let transport;
if (!isProd) {
  try {
    require.resolve("pino-pretty");
    transport = { target: "pino-pretty", options: { colorize: true, translateTime: "SYS:HH:MM:ss" } };
  } catch {
    /* pino-pretty not installed — fall back to JSON */
  }
}

const logger = pino({
  level,
  base: { service: "shobsheba-backend" },
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      'req.body.password',
      'req.body.current_password',
      'req.body.new_password',
      'req.body.password_hash',
      "*.password",
      "*.password_hash",
    ],
    censor: "[REDACTED]",
  },
  ...(transport ? { transport } : {}),
});

module.exports = logger;
