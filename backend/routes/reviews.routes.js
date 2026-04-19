const router = require("express").Router();
const c = require("../controllers/reviews.controller");

router.get("/providers/:providerId", c.listForProvider);
router.post("/", c.upsert);
router.patch("/:id", c.update);
router.delete("/:id", c.remove);

module.exports = router;
