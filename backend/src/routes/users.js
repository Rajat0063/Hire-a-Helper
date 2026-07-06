const router = require("express").Router();
const { auth } = require("../middleware/auth");
const c = require("../controllers/userController");
const a = require("../controllers/authController");

router.get("/me", auth, a.me);
router.put("/me", auth, c.updateMe);
router.get("/notifications", auth, c.notifications);
router.patch("/notifications/read", auth, c.markRead);
router.get("/overview", auth, c.overview);
router.post("/bump", auth, c.bump);
// PUBLIC profile (no PII) — used to preview a requester before accepting.
router.get("/:id/public", auth, c.publicProfile);

module.exports = router;
