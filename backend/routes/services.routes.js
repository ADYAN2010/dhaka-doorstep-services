const router = require("express").Router();
const { requireAuth, requireRole } = require("../middleware/auth");
const ctrl = require("../controllers/services.controller");

const canWrite = [requireAuth, requireRole("admin", "superadmin")];
const canDelete = [requireAuth, requireRole("superadmin")];

// Public reads
router.get("/", ctrl.list);
router.get("/:id", ctrl.getOne);

// Protected writes
router.post("/", canWrite, ctrl.create);
router.put("/:id", canWrite, ctrl.update);
router.patch("/:id", canWrite, ctrl.update);
router.delete("/:id", canDelete, ctrl.remove);

module.exports = router;
