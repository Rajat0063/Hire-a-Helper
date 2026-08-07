const router = require("express").Router();
const authModule = require("../middleware/auth");
const auth = typeof authModule === "function" ? authModule : (authModule.auth || authModule);
const c = require("../controllers/feedbackController");

if (c.submit) router.post("/", auth, c.submit);
if (c.mine) router.get("/mine", auth, c.mine);
if (c.list) router.get("/", auth, c.list);       // admin
if (c.update) router.patch("/:id", auth, c.update); // admin

module.exports = router;

