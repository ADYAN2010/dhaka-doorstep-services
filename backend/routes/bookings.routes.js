const router = require("express").Router();
const { requireAuth } = require("../middleware/auth");
const c = require("../controllers/bookings.controller");

router.get("/", requireAuth, c.list);
router.get("/:id", c.getOne); // public — used for booking-status tracking page
router.post("/", c.create);   // public — guests can submit bookings
router.patch("/:id", requireAuth, c.update);
router.delete("/:id", requireAuth, c.remove);

module.exports = router;
