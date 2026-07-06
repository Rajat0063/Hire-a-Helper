const router = require("express").Router();
const { auth } = require("../middleware/auth");
const c = require("../controllers/requestController");

router.get("/received", auth, c.received);
router.get("/sent", auth, c.sent);
router.patch("/:id", auth, c.update);
router.post("/:id/progress", auth, c.checkin);
router.post("/:id/complete", auth, c.complete);
router.post("/:id/cancel", auth, c.cancel);

module.exports = router;
