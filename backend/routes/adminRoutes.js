const express = require('express');
const adminMiddleware = require('../middleware/adminMiddleware');
const adminController = require('../controllers/adminController');
const router = express.Router();

// User management
router.get('/users', adminMiddleware, adminController.getUsers);
router.patch('/users/:id/block', adminMiddleware, adminController.blockUser);
router.patch('/users/:id/unblock', adminMiddleware, adminController.unblockUser);
router.delete('/users/:id', adminMiddleware, adminController.deleteUser);

// Task management
router.get('/tasks', adminMiddleware, adminController.getTasks);
router.delete('/tasks/:id', adminMiddleware, adminController.deleteTask);

// Dispute management
router.get('/disputes', adminMiddleware, adminController.getDisputes);
router.patch('/disputes/:id/resolve', adminMiddleware, adminController.resolveDispute);

// Analytics
router.get('/analytics', adminMiddleware, adminController.getAnalytics);

module.exports = router;
