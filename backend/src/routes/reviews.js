const router = require("express").Router();
const { auth } = require("../middleware/auth");
const c = require("../controllers/reviewController");

router.post("/", auth, c.create);
router.get("/user/:id", c.forUser);

module.exports = router;
