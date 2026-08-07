const router = require("express").Router();
const authModule = require("../middleware/auth");
const auth = typeof authModule === "function" ? authModule : (authModule.auth || authModule);
const c = require("../controllers/messageController");

if (c.listConversations) router.get("/conversations", auth, c.listConversations);
if (c.block) router.post("/block/:userId", auth, c.block);
if (c.unblock) router.delete("/block/:userId", auth, c.unblock);
if (c.listMessages) router.get("/:conversationId", auth, c.listMessages);
if (c.send) router.post("/:conversationId", auth, c.send);
if (c.remove) router.delete("/:conversationId", auth, c.remove);

module.exports = router;

