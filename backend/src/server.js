require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const User = require("./models/User");

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || "*", credentials: true }));
// ! Large limit because profile / cover / task images are stored as base64
app.use(express.json({ limit: "15mb" }));

// Health
app.get("/", (_req, res) => res.json({ ok: true, service: "hirehelper-api" }));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/tasks", require("./routes/tasks"));
app.use("/api/requests", require("./routes/requests"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/users", require("./routes/users"));

// Error guard
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: err.message || "Server error" });
});

// === Seed admin from ADMIN_EMAIL / ADMIN_PASSWORD on first boot ===
async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;
  const existing = await User.findOne({ email });
  if (existing) return;
  await User.create({
    firstName: "Admin",
    lastName: "User",
    email,
    password,
    role: "admin",
    isVerified: true,
  });
  console.log(`[seed] admin created -> ${email}`);
}

const PORT = process.env.PORT || 5000;
connectDB()
  .then(seedAdmin)
  .then(() => app.listen(PORT, () => console.log(`[api] http://localhost:${PORT}`)))
  .catch((e) => {
    console.error("Startup failed:", e);
    process.exit(1);
  });
