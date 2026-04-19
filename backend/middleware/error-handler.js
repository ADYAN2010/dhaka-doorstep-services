/**
 * Centralised error + 404 handlers.
 * Controllers can `throw` or `next(err)` — never leak SQL/stack traces to clients.
 */

class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

function notFound(req, res, next) {
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const isProd = process.env.NODE_ENV === "production";

  if (status >= 500) {
    // Log full details server-side only
    console.error("[error]", err);
  }

  res.status(status).json({
    error: {
      code: err.code || (status >= 500 ? "internal_error" : "request_error"),
      message: status >= 500 && isProd ? "Internal server error" : err.message,
      ...(err.details ? { details: err.details } : {}),
    },
  });
}

/** Wraps async route handlers so thrown errors hit errorHandler. */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { HttpError, notFound, errorHandler, asyncHandler };
