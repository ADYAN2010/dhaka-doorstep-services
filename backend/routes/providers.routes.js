const router = require("express").Router();
const { requireAuth, requireRole } = require("../middleware/auth");
const c = require("../controllers/providers.controller");

const canWrite = [requireAuth, requireRole("admin", "superadmin")];
const canDelete = [requireAuth, requireRole("superadmin")];

router.get("/", c.list);
router.get("/:id", c.getOne);
router.post("/", canWrite, c.create);
router.patch("/:id", canWrite, c.update);
router.delete("/:id", canDelete, c.remove);

module.exports = router;
