const router = require("express").Router();
const { auth } = require("../middleware/auth");
const c = require("../controllers/assistantController");

router.get("/history", auth, c.history);
router.post("/message", auth, c.chat);
router.delete("/history", auth, c.clear);

module.exports = router;
