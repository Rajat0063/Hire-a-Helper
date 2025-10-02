const express = require('express');
const router = express.Router();
const { getDashboardData } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

// This route is protected.
// A valid 'Bearer' token must be included in the Authorization header.
router.get('/data', protect, getDashboardData);

module.exports = router;