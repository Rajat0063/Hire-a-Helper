const router = require("express").Router();
const { auth } = require("../middleware/auth");
const c = require("../controllers/paymentController");

router.post("/order", auth, c.createOrder);
router.post("/verify", auth, c.verifyPayment);
router.post("/simulate", auth, c.simulatePaid); // dev fallback
module.exports = router;
