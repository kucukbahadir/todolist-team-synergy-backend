const express = require('express');
const router = express.Router();
const NotificationRepository = require('../repositories/NotificationRepository');

let db;
let notificationRepository;

// This function will fetch the database connection from app.js
function connectDB(database) {
    db = database;
    notificationRepository = new NotificationRepository(db);
}

/**
 * Get all notifications for a user
 */
router.get('/:userId', async (req, res) => {
    try {
        const notifications = await notificationRepository.getAllNotifications(req.params.userId);
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching notifications', error: err.message });
    }
});

/**
 * Read notification by ID
 */
router.post('/read/:userId/:id', async (req, res) => {
    try {
        const result = await notificationRepository.markNotificationAsRead(req.params.userId, req.params.id);
        res.status(200).send(result);
    } catch (err) {
        res.status(500).json({ message: 'Error reading notification', error: err.message });
    }
});

/**
 * Create a new notification
 */
router.post('/:userId', async (req, res) => {
    const { title, message, link } = req.body;
    try {
        const result = await notificationRepository.createNotification(req.params.userId, { title, message, link });
        res.status(201).json(result);
    } catch (err) {
        res.status(500).json({ message: 'Error creating notification', error: err.message });
    }
});

/**
 * Delete notification
 */
router.delete('/:userId/:id', async (req, res) => {
    try {
        const result = await notificationRepository.deleteNotification(req.params.userId, req.params.id);
        res.status(200).send(result);
    } catch (err) {
        res.status(500).json({ message: 'Error deleting notification', error: err.message });
    }
});

module.exports = { router, connectDB };
