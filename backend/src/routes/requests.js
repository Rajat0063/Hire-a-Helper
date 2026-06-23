const router = require("express").Router();
const { auth } = require("../middleware/auth");
const c = require("../controllers/requestController");

router.get("/received", auth, c.received);
router.get("/sent", auth, c.sent);
router.patch("/:id", auth, c.update);

module.exports = router;
