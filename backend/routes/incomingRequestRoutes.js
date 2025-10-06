const express = require('express');
const router = express.Router();
const IncomingRequest = require('../models/incomingRequestModel');
const MyTask = require('../models/myTaskModel');

// ADMIN: Get all incoming requests
router.get('/', async (req, res) => {
    try {
        const requests = await IncomingRequest.find({}).sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// ADMIN: Delete an incoming request by ID
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await IncomingRequest.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Incoming request not found' });
        res.json({ message: 'Incoming request deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});
// Mark incoming requests as seen by the current user
router.post('/mark-seen', async (req, res) => {
    try {
        const { userId, requestIds } = req.body;
        if (!userId || !Array.isArray(requestIds)) {
            return res.status(400).json({ message: 'userId and requestIds are required' });
        }
        // Update all specified incoming requests to add userId to seenBy if not already present
        await IncomingRequest.updateMany(
            { _id: { $in: requestIds }, seenBy: { $ne: userId } },
            { $addToSet: { seenBy: userId } }
        );
        res.json({ message: 'Incoming requests marked as seen' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});
const Task = require('../models/taskModel');
const User = require('../models/User');

// Create a new incoming request (when a user sends a request for a task)
const Request = require('../models/requestModel');
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

        // Create incoming request
        const incomingRequest = new IncomingRequest({
            requester: requesterId,
            requesterName,
            task: taskId,
            taskTitle: task.title,
            taskOwner: owner._id,
            taskOwnerName: owner.name,
            message,
            status: 'pending',
        });
        await incomingRequest.save();

        // Also create in requests collection for backward compatibility
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

    // Emit real-time update to the task owner for new request
    const { emitRequestsToOwner } = require('../utils/requestSocketEvents');
    emitRequestsToOwner(owner._id.toString());
    res.status(201).json(incomingRequest);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// Get incoming requests for the current task owner
// Only show pending requests to the task owner
router.get('/received/:userId', async (req, res) => {
    try {
        const requests = await IncomingRequest.find({ taskOwner: req.params.userId, status: 'pending' })
            .sort({ createdAt: -1 })
            .populate({ path: 'requester', select: 'name email image' })
            .populate({ path: 'task', select: 'title description location category imageUrl' });

        // Attach useful fields for frontend, including seenBy
        const requestsWithDetails = requests.map(req => {
            const reqObj = req.toObject();
            reqObj.requesterName = reqObj.requester && reqObj.requester.name ? reqObj.requester.name : reqObj.requesterName;
            reqObj.requesterEmail = reqObj.requester && reqObj.requester.email ? reqObj.requester.email : '';
            reqObj.requesterImage = reqObj.requester && reqObj.requester.image ? reqObj.requester.image : '';
            reqObj.taskTitle = reqObj.task && reqObj.task.title ? reqObj.task.title : reqObj.taskTitle;
            reqObj.taskDescription = reqObj.task && reqObj.task.description ? reqObj.task.description : '';
            reqObj.taskLocation = reqObj.task && reqObj.task.location ? reqObj.task.location : '';
            reqObj.taskCategory = reqObj.task && reqObj.task.category ? reqObj.task.category : '';
            reqObj.taskImage = reqObj.task && reqObj.task.imageUrl ? reqObj.task.imageUrl : '';
            reqObj.seenBy = reqObj.seenBy || [];
            return reqObj;
        });
        res.json(requestsWithDetails);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

module.exports = router;

// Get notifications for a user (requester)
router.get('/notifications/:userId', async (req, res) => {
    try {
        const notifications = await require('../models/notificationModel')
            .find({ user: req.params.userId })
            .sort({ createdAt: -1 });
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// Accept an incoming request (set status to 'accepted')
const Notification = require('../models/notificationModel');
const { emitRequestsToOwner } = require('../utils/requestSocketEvents');
router.patch('/accept/:requestId', async (req, res) => {
    try {
        const { requestId } = req.params;
        const updated = await IncomingRequest.findByIdAndUpdate(
            requestId,
            { status: 'accepted' },
            { new: true }
        );
        if (!updated) return res.status(404).json({ message: 'Request not found' });

        // Create notification for requester
    const notification = await Notification.create({
            user: updated.requester,
            type: 'request-accepted',
            message: `Your request for task '${updated.taskTitle}' was accepted! Click to view.`,
            requestId: updated._id,
            taskId: updated.task,
    });
    // Emit notification to requester in real time
    const { emitNotificationToRequester } = require('../utils/requestSocketEvents');
    emitNotificationToRequester(updated.requester.toString(), notification);

        // Add to mytask collection for the requester
        await MyTask.create({
            user: updated.requester,
            taskId: updated.task,
            taskTitle: updated.taskTitle,
            description: updated.description || '',
            status: 'assigned',
        });

    // Emit real-time update to the task owner
    emitRequestsToOwner(updated.taskOwner.toString());
    res.json({ message: 'Request accepted', request: updated });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// Decline an incoming request (set status to 'rejected')
router.patch('/decline/:requestId', async (req, res) => {
    try {
        const { requestId } = req.params;
        const updated = await IncomingRequest.findByIdAndUpdate(
            requestId,
            { status: 'rejected' },
            { new: true }
        );
        if (!updated) return res.status(404).json({ message: 'Request not found' });

        // Create notification for requester (declined)
    const notification = await Notification.create({
            user: updated.requester,
            type: 'request-declined',
            message: `Your request for task '${updated.taskTitle}' was declined. Click to view.`,
            requestId: updated._id,
            taskId: updated.task,
    });
    // Emit notification to requester in real time
    const { emitNotificationToRequester } = require('../utils/requestSocketEvents');
    emitNotificationToRequester(updated.requester.toString(), notification);

    // Emit real-time update to the task owner
    emitRequestsToOwner(updated.taskOwner.toString());
    res.json({ message: 'Request declined', request: updated });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});
// Mark a notification as read (so it won't show again)
router.patch('/notifications/read/:notificationId', async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.notificationId, { isRead: true });
        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});
