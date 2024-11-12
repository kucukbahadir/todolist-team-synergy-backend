const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

/**
 * EmailService class to send emails using Nodemailer
 * @class EmailService
 * @requires nodemailer
 *
 * @Author Yassin Rahou
 */
class EmailService {

    transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: 'smtp.sendgrid.net',
            port: 587,
            auth: {
                user: 'apikey',
                pass: process.env.SENDGRID_API_KEY
            }
        });
    }

    /**
     * Send a verification email to the user. The email contains a verification code.
     *
     * @async
     * @param email Email address to send the verification email to
     * @param code Verification code to include in the email
     * @returns {Promise<any>}
     */
    async sendVerificationEmail(email, code) {
        if (!this.transporter) {
            throw new Error('Transporter not initialized');
        }

        // Load the email template in the templates folder
        const template = fs.readFileSync(path.join(__dirname, '../templates/verification-email.html'), 'utf-8');

        // Replace the placeholder with the verification code
        const content = template.replace('{{verificationCode}}', code);

        const options = {
            from: "To-do List <" + process.env.EMAIL + ">",
            to: email,
            subject: 'Email Verification',
            html: content
        };

        try {
            return await this.transporter.sendMail(options);
        } catch (error) {
            console.error('Error sending email:', error);
            throw error;
        }
    }

    /**
     * Send a password reset email to the user. The email contains a password reset link.
     *
     * @async
     * @param email Email address to send the password reset email to
     * @param link Password reset link to include in the email
     * @returns {Promise<any>}
     */
    async sendPasswordResetEmail(email, link) {
        if (!this.transporter) {
            throw new Error('Transporter not initialized');
        }

        const template = fs.readFileSync(path.join(__dirname, '../templates/password-reset-email.html'), 'utf-8');

        const content = template.replace('{{resetLink}}', link);

        const options = {
            from: "To-do List <" + process.env.EMAIL + ">",
            to: email,
            subject: 'Password Reset',
            html: content
        };

        try {
            return await this.transporter.sendMail(options);
        } catch (error) {
            console.error('Error sending email:', error);
            throw error;
        }
    }
}

module.exports = EmailService;
