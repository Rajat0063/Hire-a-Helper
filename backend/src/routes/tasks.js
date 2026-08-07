const router = require("express").Router();
const authModule = require("../middleware/auth");
const auth = typeof authModule === "function" ? authModule : (authModule.auth || authModule);
const c = require("../controllers/taskController");

if (c.feed) router.get("/", auth, c.feed);
if (c.mine) router.get("/mine", auth, c.mine);
if (c.nearby) router.get("/nearby", auth, c.nearby);
if (c.create) router.post("/", auth, c.create);
if (c.getOne) router.get("/:id", auth, c.getOne);
if (c.update) router.patch("/:id", auth, c.update);
if (c.remove) router.delete("/:id", auth, c.remove);
if (c.requestTask) router.post("/:id/request", auth, c.requestTask);

module.exports = router;

