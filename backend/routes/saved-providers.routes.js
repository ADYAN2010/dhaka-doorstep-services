const router = require("express").Router();
const c = require("../controllers/saved-providers.controller");

router.get("/", c.list);
router.get("/ids", c.listIds);
router.post("/", c.save);
router.delete("/:providerId", c.unsave);

module.exports = router;
