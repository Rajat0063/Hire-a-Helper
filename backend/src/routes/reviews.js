const router = require("express").Router();
const authModule = require("../middleware/auth");
const auth = typeof authModule === "function" ? authModule : (authModule.auth || authModule);
const c = require("../controllers/reviewController");

if (c.create) router.post("/", auth, c.create);
if (c.forUser) router.get("/user/:id", c.forUser);

module.exports = router;

