const express = require('express');
const { getAllUsers, blockUser, unblockUser, deleteUser, getAllTasks, deleteTask, getAllDisputes, resolveDispute, getAdminStats } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// User management
router.get('/users', protect, adminOnly, getAllUsers);
router.patch('/users/:id/block', protect, adminOnly, blockUser);
router.patch('/users/:id/unblock', protect, adminOnly, unblockUser);
router.delete('/users/:id', protect, adminOnly, deleteUser);

// Task management
router.get('/tasks', protect, adminOnly, getAllTasks);
router.delete('/tasks/:id', protect, adminOnly, deleteTask);

// Dispute management
router.get('/disputes', protect, adminOnly, getAllDisputes);
router.patch('/disputes/:id/resolve', protect, adminOnly, resolveDispute);

// Analytics
router.get('/stats', protect, adminOnly, getAdminStats);

module.exports = router;
