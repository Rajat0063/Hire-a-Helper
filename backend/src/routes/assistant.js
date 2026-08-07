const router = require("express").Router();
const authModule = require("../middleware/auth");
const auth = typeof authModule === "function" ? authModule : (authModule.auth || authModule);
const c = require("../controllers/assistantController");

if (c.history) router.get("/history", auth, c.history);
if (c.chat) router.post("/message", auth, c.chat);
if (c.clear) router.delete("/history", auth, c.clear);

module.exports = router;

