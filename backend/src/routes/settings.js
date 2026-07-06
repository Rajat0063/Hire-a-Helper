const router = require("express").Router();
const c = require("../controllers/settingsController");

// Public settings (categories, maintenance flag) — no auth so Add Task /
// Feed / signup can read them.
router.get("/", c.getPublic);

module.exports = router;
