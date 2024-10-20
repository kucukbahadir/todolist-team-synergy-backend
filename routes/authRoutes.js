const express = require('express');
const router = express.Router();
const EmailService = require('../services/EmailService');
const emailService = new EmailService();
const User = require('../models/userModel');
const JWToken = require('../utils/JWToken');

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

        if (code.toString() === user.verificationCode) {
            const token = JWToken.generateToken(user);

            // Clear the verification code
            await db.collection('users').updateOne({ email }, { $unset: { verificationCode: '' } });

            // Set the token in the response header
            res.set('Authorization', `Bearer ${token}`);

            res.send('Logged in successfully');
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
        res.send('Email sent');
    } catch (error) {
        res.status(500).send('Error sending email');
    }

});

module.exports = {router, connectDB};
