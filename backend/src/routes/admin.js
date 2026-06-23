const router = require("express").Router();
const { auth, adminOnly } = require("../middleware/auth");
const c = require("../controllers/adminController");

router.post("/login", c.adminLogin);
router.get("/stats", auth, adminOnly, c.stats);
router.get("/users", auth, adminOnly, c.listUsers);
router.get("/tasks", auth, adminOnly, c.listTasks);
router.delete("/users/:id", auth, adminOnly, c.deleteUser);
router.delete("/tasks/:id", auth, adminOnly, c.deleteTask);

module.exports = router;
