const router = require("express").Router();
const { requireAuth } = require("../middleware/auth");
const c = require("../controllers/contact-messages.controller");

// Public POST — anyone can submit a contact form.
router.post("/", c.create);
// Admin GET — auth required.
router.get("/", requireAuth, c.list);

module.exports = router;
