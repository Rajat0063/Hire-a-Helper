const router = require("express").Router();
const { auth } = require("../middleware/auth");
const c = require("../controllers/taskController");

router.get("/", auth, c.feed);
router.get("/mine", auth, c.mine);
router.get("/nearby", auth, c.nearby);
router.post("/", auth, c.create);
router.get("/:id", auth, c.getOne);
router.patch("/:id", auth, c.update);
router.delete("/:id", auth, c.remove);
router.post("/:id/request", auth, c.requestTask);

module.exports = router;
