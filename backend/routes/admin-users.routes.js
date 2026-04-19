/**
 * /api/admin-users — superadmin-only management of admin team.
 */
const router = require("express").Router();
const { requireAuth, requireRole } = require("../middleware/auth");
const ctrl = require("../controllers/admin-users.controller");

router.use(requireAuth, requireRole("superadmin"));

router.get("/", ctrl.list);
router.post("/", ctrl.create);
router.get("/:id", ctrl.getOne);
router.patch("/:id", ctrl.update);
router.delete("/:id", ctrl.remove);

module.exports = router;
