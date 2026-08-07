const router = require("express").Router();
const authModule = require("../middleware/auth");
const auth = typeof authModule === "function" ? authModule : (authModule.auth || authModule);
const c = require("../controllers/searchController");

if (c.log) router.post("/log", auth, c.log);
if (c.recent) router.get("/recent", auth, c.recent);

module.exports = router;

