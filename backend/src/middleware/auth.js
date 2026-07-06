const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Settings = require("../models/Settings");

// Verify JWT and attach req.user. Blocked users are bounced with a special
// 403 USER_BLOCKED code that the frontend interceptor uses to force-logout.
async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: "No token" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(401).json({ message: "Invalid token" });
    if (user.isBlocked) {
      return res
        .status(403)
        .json({ code: "USER_BLOCKED", message: "Your account has been blocked by an administrator." });
    }
    if (user.role !== "admin") {
      const settings = await Settings.findOne({ key: "platform" }).select("maintenanceMode");
      if (settings?.maintenanceMode) {
        return res.status(503).json({ code: "MAINTENANCE_MODE", message: "The platform is currently in maintenance mode." });
      }
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== "admin") return res.status(403).json({ message: "Admin only" });
  next();
}

module.exports = { auth, adminOnly };
