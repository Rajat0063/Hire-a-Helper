const router = require("express").Router();
const authModule = require("../middleware/auth");
const auth = typeof authModule === "function" ? authModule : (authModule.auth || authModule);
const adminOnly = authModule.adminOnly || authModule;
const c = require("../controllers/adminController");
const s = require("../controllers/settingsController");

if (c.adminLogin) router.post("/login", c.adminLogin);
if (c.stats) router.get("/stats", auth, adminOnly, c.stats);
if (c.listUsers) router.get("/users", auth, adminOnly, c.listUsers);
if (c.listTasks) router.get("/tasks", auth, adminOnly, c.listTasks);
if (c.deleteUser) router.delete("/users/:id", auth, adminOnly, c.deleteUser);
if (c.deleteTask) router.delete("/tasks/:id", auth, adminOnly, c.deleteTask);
if (c.setBlocked) router.patch("/users/:id/block", auth, adminOnly, c.setBlocked);
if (c.recentRequests) router.get("/requests/recent", auth, adminOnly, c.recentRequests);
if (c.logs) router.get("/logs", auth, adminOnly, c.logs);
// platform settings
if (s.getAll) router.get("/settings", auth, adminOnly, s.getAll);
if (s.update) router.patch("/settings", auth, adminOnly, s.update);

module.exports = router;

