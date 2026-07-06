const router = require("express").Router();
const { auth } = require("../middleware/auth");
const c = require("../controllers/feedbackController");

router.post("/", auth, c.submit);
router.get("/mine", auth, c.mine);
router.get("/", auth, c.list);       // admin
router.patch("/:id", auth, c.update); // admin

module.exports = router;
