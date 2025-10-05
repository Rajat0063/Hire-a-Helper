const express = require('express');
const adminMiddleware = require('../middleware/adminMiddleware');
const { protect } = require('../middleware/authMiddleware');
const adminController = require('../controllers/adminController');
const router = express.Router();


// User management
router.get('/users', protect, adminMiddleware, adminController.getUsers);
router.patch('/users/:id/block', protect, adminMiddleware, adminController.blockUser);
router.patch('/users/:id/unblock', protect, adminMiddleware, adminController.unblockUser);
router.delete('/users/:id', protect, adminMiddleware, adminController.deleteUser);

// Task management
router.get('/tasks', protect, adminMiddleware, adminController.getTasks);
router.delete('/tasks/:id', protect, adminMiddleware, adminController.deleteTask);

// Dispute management
router.get('/disputes', protect, adminMiddleware, adminController.getDisputes);
router.patch('/disputes/:id/resolve', protect, adminMiddleware, adminController.resolveDispute);

// Analytics
router.get('/analytics', protect, adminMiddleware, adminController.getAnalytics);

module.exports = router;
