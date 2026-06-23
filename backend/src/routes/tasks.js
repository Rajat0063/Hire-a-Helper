const router = require("express").Router();
const { auth } = require("../middleware/auth");
const c = require("../controllers/taskController");

router.get("/", auth, c.feed);
router.get("/mine", auth, c.mine);
router.post("/", auth, c.create);
router.post("/:id/request", auth, c.requestTask);

module.exports = router;
