const { ping } = require("../config/db");
const { asyncHandler } = require("../middleware/error-handler");

exports.health = (req, res) => {
  res.json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() });
};

exports.testDb = asyncHandler(async (req, res) => {
  try {
    const info = await ping();
    res.json({ ok: true, db: info });
  } catch (err) {
    res.status(503).json({
      ok: false,
      error: {
        code: "db_unreachable",
        message: err.message,
        hint: "Check backend/.env credentials and that your MySQL host allows remote connections.",
      },
    });
  }
});
