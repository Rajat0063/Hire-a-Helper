const router = require("express").Router();
const authModule = require("../middleware/auth");
const auth = typeof authModule === "function" ? authModule : (authModule.auth || authModule);
const c = require("../controllers/requestController");

if (c.received) router.get("/received", auth, c.received);
if (c.sent) router.get("/sent", auth, c.sent);
if (c.update) router.patch("/:id", auth, c.update);
if (c.checkin) router.post("/:id/progress", auth, c.checkin);
if (c.complete) router.post("/:id/complete", auth, c.complete);
if (c.cancel) router.post("/:id/cancel", auth, c.cancel);

module.exports = router;

