const express = require('express');
const router = express.Router();
const EmailService = require('../services/EmailService');
const emailService = new EmailService();

// Test the verification email service
router.post('/verify', async (req, res) => {
    try {
        await emailService.sendVerificationEmail(req.body.email, req.body.code);
        res.send('Email sent');
    } catch (error) {
        res.status(500).send('Error sending email');
    }
});

// Test the password reset email service
router.post('/reset', async (req, res) => {
    try {
        await emailService.sendPasswordResetEmail(req.body.email, req.body.link);
        res.send('Email sent');
    } catch (error) {
        res.status(500).send('Error sending email');
    }
});

module.exports = router;
