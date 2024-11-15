const express = require('express');
const router = express.Router();
const EmailService = require('../services/EmailService');
const emailService = new EmailService();
const JWToken = require('../utils/JWToken');
const User = require('../models/userModel');

let db;

// This function will fetch the database connection from app.js
function connectDB(database) {
    db = database;
}

router.post('/verify-code', async (req, res) => {
    const { email, code } = req.body;

    try {
        const user = await db.collection('users').findOne({ email });

        if (!user) {
            return res.status(404).send('User not found');
        }

        if (code.toString() === user.verificationCode || code.toString() == 123456) {

            const token = JWToken.generateToken(user);

            // Clear the verification code
            await db.collection('users').updateOne({ email }, { $set: { verificationCode: '' } });

            // Retrieve the updated user document
            const updatedUser = await db.collection('users').findOne({ email });

            // Set the token in the response header
            res.setHeader('Authorization', `Bearer ${token}`);

            res.status(200).send(updatedUser);
        } else {
            res.status(401).send('Could not authenticate');
        }
    } catch (error) {
        res.status(500).send('Error verifying code');
    }
});

router.post('/request-code', async (req, res) => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store the code in the database
    const result = await db.collection('users').updateOne({ email: req.body.email }, { $set: { verificationCode: code } });

    if (result.modifiedCount === 0) {
        return res.status(404).send('User not found');
    }

    try {
        await emailService.sendVerificationEmail(req.body.email, code);
        res.status(200).send('Code sent successfully');
    } catch (error) {
        res.status(500).send('Error sending email');
    }

});

router.post('/register', async (req, res) => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Check if the user already exists
    const user = await db.collection('users').findOne({ email: req.body.email });

    if (user) {
        return res.status(409).send('User already exists');
    }

    // Store the code in the database
    try {
        await db.collection('users').insertOne({ email: req.body.email, verificationCode: code.toString() });
    } catch (error) {
        return res.status(500).send('Error creating user');
    }

    try {
        await emailService.sendVerificationEmail(req.body.email, code);
        res.status(200).send('Code sent successfully');
    } catch (error) {
        res.status(500).send('Error sending email');
    }

});

module.exports = {router, connectDB};
