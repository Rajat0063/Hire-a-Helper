// @desc    Get some protected data for the dashboard
// @route   GET /api/dashboard/data
// @access  Private

const Task = require('../models/taskModel');

const getDashboardData = async (req, res) => {
    try {
        // Fetch all tasks from the database
        const tasks = await Task.find({});
        res.json({
            message: `Welcome to your dashboard, ${req.user.name}!`,
            tasks: tasks
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch tasks.' });
    }
};

module.exports = { getDashboardData };