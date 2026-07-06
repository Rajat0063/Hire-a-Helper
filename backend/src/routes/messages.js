const router = require("express").Router();
const { auth } = require("../middleware/auth");
const c = require("../controllers/messageController");

router.get("/conversations", auth, c.listConversations);
router.post("/block/:userId", auth, c.block);
router.delete("/block/:userId", auth, c.unblock);
router.get("/:conversationId", auth, c.listMessages);
router.post("/:conversationId", auth, c.send);
router.delete("/:conversationId", auth, c.remove);

module.exports = router;
