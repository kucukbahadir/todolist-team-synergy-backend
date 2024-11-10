const express = require('express');
const router = express.Router();
const EmailService = require('../services/EmailService');
const emailService = new EmailService();
const JWToken = require('../utils/JWToken');
const User = require('../models/userModel');
const {ObjectId} = require("mongodb");

let db;

// This function will fetch the database connection from app.js
function connectDB(database) {
    db = database;
}

/**
 * Get all notifications
 */
router.get('/:userId', async (req, res) => {
    try {
        const user = await db.collection('users').findOne({_id: new ObjectId(req.params.userId)});
        res.json(user.notifications);
    } catch (err) {
        res.status(500).json({message: 'Error fetching notifications', error: err.message});
    }
});

/**
 * Read notification by ID
 */
router.post('/read/:userId/:id', async (req, res) => {
    try {
        const result = await db.collection('users').updateOne(
            {_id: new ObjectId(req.params.userId), 'notifications._id': new ObjectId(req.params.id)},
            {$set: {'notifications.$.read': true}}
        );
        res.status(200).send(result);
    } catch (err) {
        res.status(500).json({message: 'Error fetching notification', error: err.message});
    }
});

/**
 * Create notification
 */
router.post('/:userId', async (req, res) => {
    const {title, message, type, link} = req.body;
    const newNotification = {
        _id: new ObjectId(),
        title,
        message,
        type,
        link,
        createdAt: new Date(),
        read: false
    };
    try {
        // Add a new field if it doesn't exist
        await db.collection('users').updateOne({_id: new ObjectId(req.params.userId)}, {$setOnInsert: {notifications: []}});
        // Add the new notification
        const user = await db.collection('users').updateOne({_id: new ObjectId(req.params.userId)}, {$push: {notifications: newNotification}});

        res.status(201).json(user);
    } catch (err) {
        res.status(500).json({message: 'Error creating notification', error: err.message});
    }
});

/**
 * Delete notification
 */
router.delete('/:userId/:id', async (req, res) => {
    try {
        const result = await db.collection('users').updateOne(
            {_id: new ObjectId(req.params.userId)},
            {$pull: {notifications: {_id: new ObjectId(req.params.id)}}}
        );
        // send the deleted notification
        res.status(200).send(result);
    } catch (err) {
        res.status(500).json({message: 'Error deleting notification', error: err.message});
    }
});

module.exports = {router, connectDB};


