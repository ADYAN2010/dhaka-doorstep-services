const router = require("express").Router();
const { requireAuth, requireRole, optionalAuth } = require("../middleware/auth");
const c = require("../controllers/providers.controller");

const canWrite = [requireAuth, requireRole("admin", "superadmin")];
const canDelete = [requireAuth, requireRole("superadmin")];

// Public (optionalAuth so admin can pass ?all=1)
router.get("/", optionalAuth, c.list);
router.get("/by-slug/:slug", c.getBySlug);
router.get("/:id", c.getOne);

// Admin
router.post("/", canWrite, c.create);
router.patch("/:id", canWrite, c.update);
router.delete("/:id", canDelete, c.remove);

module.exports = router;
