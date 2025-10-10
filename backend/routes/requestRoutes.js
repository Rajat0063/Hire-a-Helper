const express = require('express');
const router = express.Router();
const Request = require('../models/requestModel');
const Task = require('../models/taskModel');
const User = require('../models/User');
const AdminAction = require('../models/adminActionModel');
const { protect } = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// ADMIN: Get all requests
router.get('/', async (req, res) => {
    try {
        const requests = await Request.find({}).sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// ADMIN: Delete a request by ID
router.delete('/:id', protect, adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.admin ? req.admin._id : null;
        const deleted = await Request.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ message: 'Request not found' });

        // Log admin action and emit
        if (adminId) {
            try {
                const payload = { adminId, actionType: 'delete_request', targetId: id, targetType: 'Request', notes: `Request deleted by admin` };
                console.log('AdminAction payload (requestRoutes delete):', payload);
                const created = await AdminAction.create(payload);
                console.log('AdminAction created (requestRoutes delete)');
                try {
                    const { getIO } = require('../socket');
                    const io = getIO();
                    io.emit('admin:action-created', created);
                    io.emit('admin:request-deleted', id);
                    // Also notify the requester if present
                    if (deleted && deleted.requester) {
                        io.to(`user:${deleted.requester}`).emit('user:request-deleted', id);
                    }
                    const userCount = await require('../models/User').countDocuments();
                    const taskCount = await require('../models/taskModel').countDocuments();
                    io.emit('admin:analytics-updated', { userCount, taskCount });
                } catch (socketErr) {
                    console.warn('Socket emit failed (requestRoutes delete):', socketErr && socketErr.message ? socketErr.message : socketErr);
                }
            } catch (err) {
                console.error('Error storing admin action (requestRoutes delete):', err && err.message ? err.message : err);
                if (err && err.name === 'ValidationError' && err.errors) {
                    Object.entries(err.errors).forEach(([field, e]) => console.error('Validation error', field, e.message));
                }
            }
        }

        res.json({ message: 'Request deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});
// Mark requests as seen by the current user
router.post('/mark-seen', async (req, res) => {
    try {
        const { userId, requestIds } = req.body;
        if (!userId || !Array.isArray(requestIds)) {
            return res.status(400).json({ message: 'userId and requestIds are required' });
        }
        // Update all specified requests to add userId to seenBy if not already present
        await Request.updateMany(
            { _id: { $in: requestIds }, seenBy: { $ne: userId } },
            { $addToSet: { seenBy: userId } }
        );
        res.json({ message: 'Requests marked as seen' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// Create a new request (when a user sends a request for a task)
router.post('/', async (req, res) => {
    try {
        const { requesterId, requesterName, taskId, message, taskOwnerId } = req.body;
        // Find the task
        const task = await Task.findById(taskId);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        let owner;
        // Prefer direct taskOwnerId if provided
        if (taskOwnerId) {
            owner = await User.findById(taskOwnerId);
        } else {
            owner = await User.findOne({ name: task.postedByName });
        }
        if (!owner) {
            console.error('Task owner not found for task:', taskId, 'with postedByName:', task.postedByName);
            return res.status(404).json({ message: 'Task owner not found' });
        }

        // Create request
        const request = new Request({
            requester: requesterId,
            requesterName,
            task: taskId,
            taskTitle: task.title,
            taskOwner: owner._id,
            taskOwnerName: owner.name,
            message,
            status: 'pending',
        });
        await request.save();
        res.status(201).json(request);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// Get requests sent by the current user (My Requests)
// Get requests sent by the current user (My Requests) with task image
router.get('/sent/:userId', async (req, res) => {
    try {
        // Populate the 'task' field to get the imageUrl
        const requests = await Request.find({ requester: req.params.userId })
            .sort({ createdAt: -1 })
            .populate({ path: 'task', select: 'imageUrl' });

        // Attach the imageUrl to each request for frontend convenience
        const requestsWithImage = requests.map(req => {
            const reqObj = req.toObject();
            reqObj.image = reqObj.task && reqObj.task.imageUrl ? reqObj.task.imageUrl : '';
            return reqObj;
        });
        res.json(requestsWithImage);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// Get requests received by the current user (Incoming Requests)
// Get requests received by the current user (Incoming Requests) with requester and task details
router.get('/received/:userId', async (req, res) => {
    try {
        const requests = await Request.find({ taskOwner: req.params.userId })
            .sort({ createdAt: -1 })
            .populate({ path: 'requester', select: 'name email' })
            .populate({ path: 'task', select: 'title description location category imageUrl' });

        // Attach useful fields for frontend
        const requestsWithDetails = requests.map(req => {
            const reqObj = req.toObject();
            reqObj.requesterName = reqObj.requester && reqObj.requester.name ? reqObj.requester.name : reqObj.requesterName;
            reqObj.requesterEmail = reqObj.requester && reqObj.requester.email ? reqObj.requester.email : '';
            reqObj.taskTitle = reqObj.task && reqObj.task.title ? reqObj.task.title : reqObj.taskTitle;
            reqObj.taskDescription = reqObj.task && reqObj.task.description ? reqObj.task.description : '';
            reqObj.taskLocation = reqObj.task && reqObj.task.location ? reqObj.task.location : '';
            reqObj.taskCategory = reqObj.task && reqObj.task.category ? reqObj.task.category : '';
            reqObj.taskImage = reqObj.task && reqObj.task.imageUrl ? reqObj.task.imageUrl : '';
            return reqObj;
        });
        res.json(requestsWithDetails);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

module.exports = router;
