const router = require("express").Router();
const c = require("../controllers/categories.controller");

router.get("/", c.list);
router.post("/", c.create);
router.get("/:id", c.getOne);
router.patch("/:id", c.update);
router.delete("/:id", c.remove);

module.exports = router;
