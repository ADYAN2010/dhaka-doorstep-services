const router = require("express").Router();
const { requireAuth } = require("../middleware/auth");
const c = require("../controllers/bookings.controller");

// Auth required for list (admin/staff use Hostinger bridge instead).
router.get("/", requireAuth, c.list);
// Public — used by /booking-status/:id tracking page.
router.get("/:id", c.getOne);
// Public — guests submit bookings from /book.
router.post("/", c.create);
router.patch("/:id", requireAuth, c.update);
router.delete("/:id", requireAuth, c.remove);

module.exports = router;
