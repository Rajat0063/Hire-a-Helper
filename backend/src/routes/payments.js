const router = require("express").Router();
const authModule = require("../middleware/auth");
const auth = typeof authModule === "function" ? authModule : (authModule.auth || authModule);
const c = require("../controllers/paymentController");

if (c.history) router.get("/history", auth, c.history);
if (c.config) router.get("/config", auth, c.config);
if (c.createOrder) router.post("/order", auth, c.createOrder);
if (c.verifyPayment) router.post("/verify", auth, c.verifyPayment);
if (c.simulatePaid) router.post("/simulate", auth, c.simulatePaid); // dev fallback

module.exports = router;


