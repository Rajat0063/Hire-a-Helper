const express = require('express');
const router = express.Router();
const IncomingRequest = require('../models/incomingRequestModel');

// Get requests sent by the current user (My Requests)
router.get('/sent/:userId', async (req, res) => {
    try {
        const requests = await IncomingRequest.find({ requester: req.params.userId })
            .sort({ createdAt: -1 })
            .populate({ path: 'task', select: 'title description location category imageUrl' })
            .populate({ path: 'taskOwner', select: 'name email' });

        // Attach useful fields for frontend
        const requestsWithDetails = requests.map(req => {
            const reqObj = req.toObject();
            reqObj.taskTitle = reqObj.task && reqObj.task.title ? reqObj.task.title : reqObj.taskTitle;
            reqObj.taskDescription = reqObj.task && reqObj.task.description ? reqObj.task.description : '';
            reqObj.taskLocation = reqObj.task && reqObj.task.location ? reqObj.task.location : '';
            reqObj.taskCategory = reqObj.task && reqObj.task.category ? reqObj.task.category : '';
            reqObj.taskImage = reqObj.task && reqObj.task.imageUrl ? reqObj.task.imageUrl : '';
            reqObj.taskOwnerName = reqObj.taskOwner && reqObj.taskOwner.name ? reqObj.taskOwner.name : reqObj.taskOwnerName;
            reqObj.taskOwnerEmail = reqObj.taskOwner && reqObj.taskOwner.email ? reqObj.taskOwner.email : '';
            return reqObj;
        });
        res.json(requestsWithDetails);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

module.exports = router;
