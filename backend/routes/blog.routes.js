const router = require("express").Router();
const c = require("../controllers/blog.controller");

router.get("/", c.listPublished);
router.get("/slugs", c.listSlugs);
router.get("/:slug", c.getBySlug);

module.exports = router;
