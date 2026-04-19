const router = require("express").Router();
const { requireAuth } = require("../middleware/auth");
const c = require("../controllers/areas.controller");

router.get("/", c.list);
router.get("/:id", c.getOne);
router.post("/", requireAuth, c.create);
router.patch("/:id", requireAuth, c.update);
router.delete("/:id", requireAuth, c.remove);

module.exports = router;
