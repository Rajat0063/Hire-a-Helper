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

module.exports = router;
