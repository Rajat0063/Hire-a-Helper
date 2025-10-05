// backend/middleware/adminMiddleware.js
const User = require('../models/User');

const adminMiddleware = async (req, res, next) => {
  try {
  const userId = req.user && (req.user._id || req.user.id);
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    const user = await User.findById(userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    if (user.isBlocked) {
      return res.status(403).json({ message: 'Account is blocked' });
    }
    req.admin = user;
    next();
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = adminMiddleware;
