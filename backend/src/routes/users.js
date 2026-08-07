const router = require("express").Router();
const authModule = require("../middleware/auth");
const auth = typeof authModule === "function" ? authModule : (authModule.auth || authModule);
const c = require("../controllers/userController");
const a = require("../controllers/authController");

if (a.me) router.get("/me", auth, a.me);
if (c.updateMe) router.put("/me", auth, c.updateMe);
if (c.notifications) router.get("/notifications", auth, c.notifications);
if (c.markRead) router.patch("/notifications/read", auth, c.markRead);
if (c.overview) router.get("/overview", auth, c.overview);
if (c.bump) router.post("/bump", auth, c.bump);
// PUBLIC profile (no PII) — used to preview a requester before accepting.
if (c.publicProfile) router.get("/:id/public", auth, c.publicProfile);

module.exports = router;

