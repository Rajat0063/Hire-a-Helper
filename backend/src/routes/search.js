const router = require("express").Router();
const { auth } = require("../middleware/auth");
const c = require("../controllers/searchController");

router.post("/log", auth, c.log);
router.get("/recent", auth, c.recent);

module.exports = router;
