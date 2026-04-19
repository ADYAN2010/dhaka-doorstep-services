const router = require("express").Router();
const { requireAuth } = require("../middleware/auth");
const c = require("../controllers/provider-applications.controller");

// Anyone can submit an application from /become-provider.
router.post("/", c.create);
router.get("/", requireAuth, c.list);

module.exports = router;
