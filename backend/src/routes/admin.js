const router = require("express").Router();
const { auth, adminOnly } = require("../middleware/auth");
const c = require("../controllers/adminController");
const s = require("../controllers/settingsController");

router.post("/login", c.adminLogin);
router.get("/stats", auth, adminOnly, c.stats);
router.get("/users", auth, adminOnly, c.listUsers);
router.get("/tasks", auth, adminOnly, c.listTasks);
router.delete("/users/:id", auth, adminOnly, c.deleteUser);
router.delete("/tasks/:id", auth, adminOnly, c.deleteTask);
router.patch("/users/:id/block", auth, adminOnly, c.setBlocked);
router.get("/requests/recent", auth, adminOnly, c.recentRequests);
router.get("/logs", auth, adminOnly, c.logs);

// platform settings
router.get("/settings", auth, adminOnly, s.getAll);
router.patch("/settings", auth, adminOnly, s.update);

module.exports = router;
